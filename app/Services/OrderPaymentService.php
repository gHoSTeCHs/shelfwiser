<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Support\Facades\DB;

class OrderPaymentService
{
    public function recordPayment(Order $order, array $validated, int $recordedBy): OrderPayment
    {
        return DB::transaction(function () use ($order, $validated, $recordedBy) {
            $lockedOrder = Order::query()->lockForUpdate()->find($order->id);
            $remaining = $lockedOrder->remainingBalance();

            if ((float) $validated['amount'] > $remaining + 0.001) {
                throw new \InvalidArgumentException(
                    'Payment amount of ₦'.number_format($validated['amount'], 2).
                    ' exceeds remaining balance of ₦'.number_format($remaining, 2)
                );
            }

            return OrderPayment::query()->create([
                'order_id' => $order->id,
                'tenant_id' => $order->tenant_id,
                'shop_id' => $order->shop_id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'payment_date' => $validated['payment_date'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => $recordedBy,
            ]);
        });
    }

    public function deletePayment(OrderPayment $payment): float
    {
        $amount = $payment->amount;
        $payment->delete();

        return (float) $amount;
    }
}
