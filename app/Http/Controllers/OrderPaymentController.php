<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecordOrderPaymentRequest;
use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Support\Facades\Gate;

class OrderPaymentController extends Controller
{
    /**
     * Record a new payment for an order
     */
    public function store(RecordOrderPaymentRequest $request, Order $order)
    {
        $validated = $request->validated();

        OrderPayment::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'payment_date' => $validated['payment_date'],
            'reference_number' => $validated['reference_number'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'recorded_by' => auth()->id(),
        ]);

        return back()->with('success', 'Payment of ₦'.number_format($validated['amount'], 2).' recorded successfully');
    }

    /**
     * Delete a payment record
     */
    public function destroy(OrderPayment $orderPayment)
    {
        Gate::authorize('delete', $orderPayment);

        $amount = $orderPayment->amount;
        $orderPayment->delete();

        return back()->with('success', 'Payment of ₦'.number_format($amount, 2).' deleted successfully');
    }
}
