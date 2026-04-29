<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Order;
use App\Models\User;
use App\Services\Payment\PaymentGatewayManager;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderRefundService
{
    public function __construct(
        private readonly PaymentGatewayManager $paymentGatewayManager,
        private readonly StockMovementService $stockMovementService
    ) {}

    /**
     * Process a full order refund
     *
     * @throws Throwable
     */
    public function refundOrder(
        Order $order,
        User $user,
        string $reason,
        bool $restockItems = true
    ): Order {
        if ($order->status !== OrderStatus::DELIVERED) {
            throw new Exception('Only delivered orders can be refunded');
        }

        if ($order->payment_status === PaymentStatus::REFUNDED) {
            throw new Exception('Order has already been refunded');
        }

        try {
            return DB::transaction(function () use ($order, $user, $reason, $restockItems) {
                $lockedOrder = Order::query()->lockForUpdate()->find($order->id);

                if ($lockedOrder->payment_status === PaymentStatus::REFUNDED) {
                    throw new Exception('Order has already been refunded');
                }

                if ($lockedOrder->status !== OrderStatus::DELIVERED) {
                    throw new Exception('Only delivered orders can be refunded');
                }

                $refundResults = [];

                $lockedOrder->load('payments');

                // Process refunds through payment gateways
                foreach ($lockedOrder->payments as $payment) {
                    if ($payment->amount > 0) {
                        $methodIdentifier = $payment->payment_method instanceof \UnitEnum
                            ? $payment->payment_method->value
                            : (string) $payment->payment_method;

                        if (! $this->paymentGatewayManager->has($methodIdentifier)) {
                            $payment->update([
                                'refund_status' => 'pending',
                                'refund_reason' => $reason,
                                'refund_notes' => 'Manual refund required - no gateway registered for '.$methodIdentifier,
                            ]);

                            continue;
                        }

                        $gateway = $this->paymentGatewayManager->gateway($methodIdentifier);

                        if ($gateway->supportsRefunds()) {
                            $refundResult = $gateway->refund($payment, null, $reason);
                            $refundResults[] = $refundResult;

                            // Update payment record
                            $payment->update([
                                'refund_amount' => $payment->amount,
                                'refund_status' => $refundResult->status,
                                'refund_reference' => $refundResult->refundReference,
                                'refund_reason' => $reason,
                                'refunded_at' => now(),
                                'refunded_by' => $user->id,
                            ]);
                        } else {
                            // Manual refund required
                            $payment->update([
                                'refund_status' => 'pending',
                                'refund_reason' => $reason,
                                'refund_notes' => 'Manual refund required - gateway does not support automatic refunds',
                            ]);
                        }
                    }
                }

                // Restock items if requested
                if ($restockItems) {
                    $order->loadMissing('items.productVariant.inventoryLocations');

                    foreach ($order->items as $item) {
                        if ($item->isProduct()) {
                            $variant = $item->productVariant;
                            $location = $variant->inventoryLocations
                                ->where('location_type', \App\Models\Shop::class)
                                ->where('location_id', $order->shop_id)
                                ->first();

                            if ($location) {
                                $this->stockMovementService->adjustStock(
                                    $variant,
                                    $location,
                                    $item->quantity,
                                    StockMovementType::RETURN,
                                    $user,
                                    "Order #{$order->order_number} Refund",
                                    "Restocked from refunded order. Reason: {$reason}"
                                );
                            }
                        }
                    }
                }

                // Update order status
                $order->status = OrderStatus::REFUNDED;
                $order->payment_status = PaymentStatus::REFUNDED;
                $order->refunded_at = now();
                $order->refunded_by = $user->id;
                $order->internal_notes = ($order->internal_notes ? $order->internal_notes."\n\n" : '').
                    "Refunded by {$user->name} at ".now()->format('Y-m-d H:i:s').
                    "\nReason: {$reason}".
                    ($restockItems ? "\nItems restocked to inventory" : '');
                $order->save();

                Log::info('Order refunded successfully.', [
                    'order_id' => $order->id,
                    'refunded_by' => $user->id,
                    'reason' => $reason,
                    'restocked' => $restockItems,
                ]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order refund failed.', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Process a partial refund for specific order items
     *
     * @throws Throwable
     */
    public function partialRefund(
        Order $order,
        User $user,
        array $items, // ['item_id' => quantity]
        string $reason,
        bool $restockItems = true
    ): Order {
        if ($order->status !== OrderStatus::DELIVERED) {
            throw new Exception('Only delivered orders can be refunded');
        }

        try {
            return DB::transaction(function () use ($order, $user, $items, $reason, $restockItems) {
                $lockedOrder = Order::query()->lockForUpdate()->find($order->id);

                if ($lockedOrder->status !== OrderStatus::DELIVERED) {
                    throw new Exception('Only delivered orders can be partially refunded');
                }

                $refundAmount = 0;

                $itemIds = array_keys($items);
                $orderItems = $order->items()
                    ->whereIn('id', $itemIds)
                    ->with('productVariant.inventoryLocations')
                    ->get()
                    ->keyBy('id');

                // Calculate refund amount and process restocking
                foreach ($items as $itemId => $quantity) {
                    $orderItem = $orderItems->get($itemId);

                    if (! $orderItem) {
                        throw new Exception("Order item {$itemId} not found");
                    }

                    if ($quantity > $orderItem->quantity) {
                        throw new Exception('Refund quantity cannot exceed ordered quantity');
                    }

                    // Calculate proportional refund
                    $itemRefundAmount = ($orderItem->unit_price * $quantity);
                    $refundAmount += $itemRefundAmount;

                    // Restock if requested
                    if ($restockItems && $orderItem->isProduct()) {
                        $variant = $orderItem->productVariant;
                        $location = $variant->inventoryLocations
                            ->where('location_type', \App\Models\Shop::class)
                            ->where('location_id', $order->shop_id)
                            ->first();

                        if ($location) {
                            $this->stockMovementService->adjustStock(
                                $variant,
                                $location,
                                $quantity,
                                StockMovementType::RETURN,
                                $user,
                                "Order #{$order->order_number} Partial Refund",
                                "Partial refund of {$quantity} units. Reason: {$reason}"
                            );
                        }
                    }
                }

                // Process partial refund through payment gateway
                if ($refundAmount > 0 && $order->payments->count() > 0) {
                    $payment = $order->payments()->orderBy('created_at', 'desc')->first();
                    $methodIdentifier = $payment->payment_method instanceof \UnitEnum
                        ? $payment->payment_method->value
                        : (string) $payment->payment_method;

                    if (! $this->paymentGatewayManager->has($methodIdentifier)) {
                        $payment->update([
                            'refund_status' => 'pending',
                            'refund_reason' => $reason,
                            'refund_notes' => 'Manual refund required - no gateway registered for '.$methodIdentifier,
                        ]);
                    } else {
                        $gateway = $this->paymentGatewayManager->gateway($methodIdentifier);

                        if ($gateway->supportsRefunds()) {
                            $newRefundTotal = ($payment->refund_amount ?? 0) + $refundAmount;
                            if ($newRefundTotal > $payment->amount) {
                                throw new Exception(
                                    "Refund amount ({$refundAmount}) would exceed original payment ({$payment->amount}). "
                                    ."Already refunded: {$payment->refund_amount}"
                                );
                            }

                            $refundResult = $gateway->refund($payment, $refundAmount, $reason);

                            $payment->update([
                                'refund_amount' => $newRefundTotal,
                                'refund_status' => $refundResult->status,
                                'refund_reference' => $refundResult->refundReference,
                                'refund_reason' => $reason,
                            ]);
                        }
                    }
                }

                // Update order
                $order->internal_notes = ($order->internal_notes ? $order->internal_notes."\n\n" : '').
                    "Partial refund by {$user->name} at ".now()->format('Y-m-d H:i:s').
                    "\nAmount: \${$refundAmount}".
                    "\nReason: {$reason}";
                $order->save();

                Log::info('Partial order refund processed.', [
                    'order_id' => $order->id,
                    'refund_amount' => $refundAmount,
                    'items' => $items,
                ]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Partial refund failed.', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
