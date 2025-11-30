<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderReturnService
{
    public function __construct(
        private readonly StockMovementService $stockMovementService,
        private readonly OrderRefundService $refundService
    ) {}

    /**
     * Create a return request
     * @throws Throwable
     */
    public function createReturn(
        Order $order,
        User $user,
        array $items, // ['order_item_id' => ['quantity' => int, 'reason' => string, 'condition_notes' => string]]
        string $reason,
        ?string $notes = null
    ): OrderReturn {
        if (!in_array($order->status->value, ['delivered', 'completed'])) {
            throw new Exception('Only delivered or completed orders can be returned');
        }

        try {
            return DB::transaction(function () use ($order, $user, $items, $reason, $notes) {
                // Generate unique return number
                $returnNumber = 'RET-' . strtoupper(uniqid());

                $return = OrderReturn::create([
                    'tenant_id' => $order->tenant_id,
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'return_number' => $returnNumber,
                    'status' => 'pending',
                    'reason' => $reason,
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                // Create return items
                foreach ($items as $orderItemId => $itemData) {
                    $orderItem = $order->items()->find($orderItemId);

                    if (!$orderItem) {
                        throw new Exception("Order item {$orderItemId} not found");
                    }

                    if ($itemData['quantity'] > $orderItem->quantity) {
                        throw new Exception("Return quantity cannot exceed ordered quantity");
                    }

                    $return->items()->create([
                        'order_item_id' => $orderItemId,
                        'quantity' => $itemData['quantity'],
                        'reason' => $itemData['reason'] ?? null,
                        'condition_notes' => $itemData['condition_notes'] ?? null,
                    ]);
                }

                Log::info('Return request created.', [
                    'return_id' => $return->id,
                    'order_id' => $order->id,
                    'created_by' => $user->id,
                ]);

                return $return;
            });
        } catch (Throwable $e) {
            Log::error('Return request creation failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Approve a return request
     * @throws Throwable
     */
    public function approveReturn(
        OrderReturn $return,
        User $user,
        bool $restockItems = true,
        bool $processRefund = true
    ): OrderReturn {
        if (!$return->isPending()) {
            throw new Exception('Only pending returns can be approved');
        }

        try {
            return DB::transaction(function () use ($return, $user, $restockItems, $processRefund) {
                $refundAmount = 0;

                // Restock items if requested
                if ($restockItems) {
                    foreach ($return->items as $returnItem) {
                        $orderItem = $returnItem->orderItem;

                        if ($orderItem->isProduct()) {
                            $variant = $orderItem->productVariant;
                            $location = $variant->inventoryLocations()
                                ->where('location_type', 'App\\Models\\Shop')
                                ->where('location_id', $return->order->shop_id)
                                ->first();

                            if ($location) {
                                $this->stockMovementService->adjustStock(
                                    $variant,
                                    $location,
                                    -$returnItem->quantity, // Negative to add stock back
                                    StockMovementType::RETURN,
                                    $user,
                                    "Return #{$return->return_number}",
                                    "Restocked from approved return. Reason: {$return->reason}"
                                );
                            }
                        }

                        // Calculate refund amount
                        $refundAmount += ($orderItem->unit_price * $returnItem->quantity);
                    }

                    $return->restocked = true;
                }

                // Process refund if requested
                if ($processRefund && $refundAmount > 0) {
                    $this->refundService->partialRefund(
                        $return->order,
                        $user,
                        $return->items->mapWithKeys(function ($item) {
                            return [$item->order_item_id => $item->quantity];
                        })->toArray(),
                        "Return #{$return->return_number}: {$return->reason}",
                        false // Don't restock again, we already did it above
                    );
                }

                // Update return status
                $return->status = 'approved';
                $return->approved_by = $user->id;
                $return->approved_at = now();
                $return->refund_amount = $refundAmount;
                $return->save();

                Log::info('Return approved.', [
                    'return_id' => $return->id,
                    'approved_by' => $user->id,
                    'refund_amount' => $refundAmount,
                    'restocked' => $restockItems,
                ]);

                return $return;
            });
        } catch (Throwable $e) {
            Log::error('Return approval failed.', [
                'return_id' => $return->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Reject a return request
     * @throws Throwable
     */
    public function rejectReturn(
        OrderReturn $return,
        User $user,
        ?string $rejectionReason = null
    ): OrderReturn {
        if (!$return->isPending()) {
            throw new Exception('Only pending returns can be rejected');
        }

        try {
            return DB::transaction(function () use ($return, $user, $rejectionReason) {
                $return->status = 'rejected';
                $return->rejected_by = $user->id;
                $return->rejected_at = now();

                if ($rejectionReason) {
                    $return->notes = ($return->notes ? $return->notes . "\n\n" : '') .
                        "Rejection Reason: {$rejectionReason}";
                }

                $return->save();

                Log::info('Return rejected.', [
                    'return_id' => $return->id,
                    'rejected_by' => $user->id,
                ]);

                return $return;
            });
        } catch (Throwable $e) {
            Log::error('Return rejection failed.', [
                'return_id' => $return->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Complete a return (after approval and refund processing)
     * @throws Throwable
     */
    public function completeReturn(
        OrderReturn $return,
        User $user
    ): OrderReturn {
        if (!$return->isApproved()) {
            throw new Exception('Only approved returns can be completed');
        }

        try {
            return DB::transaction(function () use ($return, $user) {
                $return->status = 'completed';
                $return->completed_by = $user->id;
                $return->completed_at = now();
                $return->save();

                Log::info('Return completed.', [
                    'return_id' => $return->id,
                    'completed_by' => $user->id,
                ]);

                return $return;
            });
        } catch (Throwable $e) {
            Log::error('Return completion failed.', [
                'return_id' => $return->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }
}
