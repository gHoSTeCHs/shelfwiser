<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecordOrderPaymentRequest;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\OrderPaymentService;
use Illuminate\Support\Facades\Gate;

class OrderPaymentController extends Controller
{
    public function __construct(
        private readonly OrderPaymentService $orderPaymentService,
    ) {}

    public function store(RecordOrderPaymentRequest $request, Order $order): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('create', [OrderPayment::class, $order]);

        $payment = $this->orderPaymentService->recordPayment($order, $request->validated(), $request->user()->id);

        return back()->with('success', 'Payment of ₦'.number_format($payment->amount, 2).' recorded successfully');
    }

    /**
     * Delete a payment record
     */
    public function destroy(OrderPayment $orderPayment): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('delete', $orderPayment);

        $amount = $this->orderPaymentService->deletePayment($orderPayment);

        return back()->with('success', 'Payment of ₦'.number_format($amount, 2).' deleted successfully');
    }
}
