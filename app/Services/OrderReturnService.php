<?php

namespace App\Services;

use App\Enums\OrderReturnStatus;
use App\Enums\OrderStatus;
use App\Enums\StockMovementType;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\User;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderReturnService
{
    public function __construct(
        private readonly StockMovementService $stockMovementService,
        private readonly OrderRefundService $refundService
    ) {}

    public function getReturnsList(User $user, array $filters): LengthAwarePaginator
    {
        $query = OrderReturn::query()
            ->where('tenant_id', $user->tenant_id)
            ->with(['order', 'items.orderItem', 'createdByUser'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(20);
    }

    public function getOrderForReturnCreate(Order $order): Order
    {
        $order->load(['items.productVariant.product', 'customer']);

        return $order;
    }

    /**
     * Create a return request
     *
     * @param  array<int, array{order_item_id: int|string, quantity: int, reason: ?string, condition_notes: ?string}>  $items
     *
     * @throws Throwable
     */
    public function createReturn(
        Order $order,
        User $user,
        array $items,
        string $reason,
        ?string $notes = null
    ): OrderReturn {
        if ($order->status !== OrderStatus::DELIVERED) {
            throw new Exception('Only delivered orders can be returned');
        }

        $mappedItems = collect($items)->mapWithKeys(fn ($item) => [
            $item['order_item_id'] => [
                'quantity' => $item['quantity'],
                'reason' => $item['reason'] ?? null,
                'condition_notes' => $item['condition_notes'] ?? null,
            ],
        ])->toArray();

        $itemIds = array_keys($mappedItems);

        try {
            return DB::transaction(function () use ($order, $user, $mappedItems, $reason, $notes, $itemIds) {
                Order::query()->where('id', $order->id)->lockForUpdate()->first();

                $orderItems = $order->items()
                    ->whereIn('id', $itemIds)
                    ->get()
                    ->keyBy('id');

                $alreadyReturnedMap = \App\Models\ReturnItem::query()
                    ->whereIn('order_item_id', $itemIds)
                    ->whereHas('return', fn ($q) => $q->whereIn('status', [
                        OrderReturnStatus::PENDING->value,
                        OrderReturnStatus::APPROVED->value,
                        OrderReturnStatus::COMPLETED->value,
                    ]))
                    ->lockForUpdate()
                    ->get()
                    ->groupBy('order_item_id')
                    ->map(fn ($rows) => $rows->sum('quantity'));

                $returnNumber = 'RET-'.\Illuminate\Support\Str::ulid()->toString();

                $return = OrderReturn::query()->create([
                    'tenant_id' => $order->tenant_id,
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'return_number' => $returnNumber,
                    'status' => OrderReturnStatus::PENDING,
                    'reason' => $reason,
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                foreach ($mappedItems as $orderItemId => $itemData) {
                    $orderItem = $orderItems->get($orderItemId);

                    if (! $orderItem) {
                        throw new Exception("Order item {$orderItemId} not found");
                    }

                    if (! $orderItem->isProduct()) {
                        throw new \InvalidArgumentException("Only product items can be returned. Service item {$orderItem->id} is not returnable.");
                    }

                    $alreadyReturned = $alreadyReturnedMap->get($orderItemId, 0);

                    $remainingReturnable = $orderItem->quantity - $alreadyReturned;

                    if ($itemData['quantity'] > $remainingReturnable) {
                        throw new Exception(
                            "Return quantity ({$itemData['quantity']}) exceeds returnable quantity ({$remainingReturnable}) for order item {$orderItemId}"
                        );
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
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Approve a return request
     *
     * @throws Throwable
     */
    public function approveReturn(
        OrderReturn $return,
        User $user,
        bool $restockItems = true,
        bool $processRefund = true
    ): OrderReturn {
        if (! $return->isPending()) {
            throw new Exception('Only pending returns can be approved');
        }

        try {
            return DB::transaction(function () use ($return, $user, $restockItems, $processRefund) {
                $lockedReturn = OrderReturn::query()->where('id', $return->id)->lockForUpdate()->firstOrFail();
                $lockedReturn->load('items.orderItem.productVariant.inventoryLocations', 'order');

                $refundAmount = $lockedReturn->items->sum(
                    fn ($returnItem) => $returnItem->orderItem->unit_price * $returnItem->quantity
                );

                if ($restockItems && ! $lockedReturn->restocked) {
                    foreach ($lockedReturn->items as $returnItem) {
                        $orderItem = $returnItem->orderItem;

                        if ($orderItem->isProduct()) {
                            $variant = $orderItem->productVariant;
                            $location = $variant->inventoryLocations
                                ->where('location_type', \App\Models\Shop::class)
                                ->where('location_id', $lockedReturn->order->shop_id)
                                ->first();

                            if ($location) {
                                $this->stockMovementService->adjustStock(
                                    $variant,
                                    $location,
                                    $returnItem->quantity,
                                    StockMovementType::RETURN,
                                    $user,
                                    "Return #{$lockedReturn->return_number}",
                                    "Restocked from approved return. Reason: {$lockedReturn->reason}"
                                );
                            }
                        }
                    }

                    $lockedReturn->restocked = true;
                    $lockedReturn->save();
                }

                if ($processRefund && $refundAmount > 0) {
                    $this->refundService->partialRefund(
                        $lockedReturn->order,
                        $user,
                        $lockedReturn->items->mapWithKeys(function ($item) {
                            return [$item->order_item_id => $item->quantity];
                        })->toArray(),
                        "Return #{$lockedReturn->return_number}: {$lockedReturn->reason}",
                        false // Don't restock again, we already did it above
                    );
                }

                $lockedReturn->status = OrderReturnStatus::APPROVED;
                $lockedReturn->approved_by = $user->id;
                $lockedReturn->approved_at = now();
                $lockedReturn->refund_amount = $refundAmount;
                $lockedReturn->save();

                Log::info('Return approved.', [
                    'return_id' => $lockedReturn->id,
                    'approved_by' => $user->id,
                    'refund_amount' => $refundAmount,
                    'restocked' => $restockItems,
                ]);

                return $lockedReturn;
            });
        } catch (Throwable $e) {
            Log::error('Return approval failed.', [
                'return_id' => $return->id,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Reject a return request
     *
     * @throws Throwable
     */
    public function rejectReturn(
        OrderReturn $return,
        User $user,
        ?string $rejectionReason = null
    ): OrderReturn {
        if (! $return->isPending()) {
            throw new Exception('Only pending returns can be rejected');
        }

        try {
            return DB::transaction(function () use ($return, $user, $rejectionReason) {
                $return->status = OrderReturnStatus::REJECTED;
                $return->rejected_by = $user->id;
                $return->rejected_at = now();

                if ($rejectionReason) {
                    $return->notes = ($return->notes ? $return->notes."\n\n" : '').
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
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Complete a return (after approval and refund processing)
     *
     * @throws Throwable
     */
    public function completeReturn(
        OrderReturn $return,
        User $user
    ): OrderReturn {
        if (! $return->isApproved()) {
            throw new Exception('Only approved returns can be completed');
        }

        try {
            return DB::transaction(function () use ($return, $user) {
                $return->status = OrderReturnStatus::COMPLETED;
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
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
