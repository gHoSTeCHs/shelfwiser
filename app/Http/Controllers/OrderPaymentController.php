<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrderPaymentController extends Controller
{
    /**
     * Record a new payment for an order
     */
    public function store(Request $request, Order $order)
    {
        Gate::authorize('create', [OrderPayment::class, $order]);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:cash,card,bank_transfer,mobile_money,customer_credit',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validated['amount'] > $order->remainingBalance()) {
            return back()->withErrors([
                'amount' => 'Payment amount cannot exceed remaining balance of ₦' . number_format($order->remainingBalance(), 2)
            ]);
        }

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

        return back()->with('success', 'Payment of ₦' . number_format($validated['amount'], 2) . ' recorded successfully');
    }

    /**
     * Delete a payment record
     */
    public function destroy(OrderPayment $orderPayment)
    {
        Gate::authorize('delete', $orderPayment);

        $amount = $orderPayment->amount;
        $orderPayment->delete();

        return back()->with('success', 'Payment of ₦' . number_format($amount, 2) . ' deleted successfully');
    }
}
