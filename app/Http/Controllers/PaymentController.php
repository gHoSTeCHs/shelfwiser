<?php

namespace App\Http\Controllers;

use App\Http\Requests\InitializePaymentRequest;
use App\Http\Requests\PaymentCallbackRequest;
use App\Http\Requests\VerifyPaymentRequest;
use App\Models\Order;
use App\Services\Payment\PaymentGatewayManager;
use App\Services\Payment\PaymentProcessingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentGatewayManager $gatewayManager,
        protected PaymentProcessingService $paymentProcessingService,
    ) {}

    /**
     * Handle payment gateway callback/redirect.
     */
    public function callback(PaymentCallbackRequest $request, string $gatewayName, Order $order): RedirectResponse
    {
        Gate::authorize('handlePayment', $order);

        $outcome = $this->paymentProcessingService->handleCallback($order, $gatewayName, $request->reference());

        $redirect = redirect()->route('orders.show', $order);

        return match ($outcome['status']) {
            'success' => $redirect->with('success', $outcome['message']),
            'pending' => $redirect->with('info', $outcome['message']),
            'missing_reference', 'failed' => $redirect->with('error', $outcome['message']),
        };
    }

    /**
     * Initialize a payment for an order.
     */
    public function initialize(InitializePaymentRequest $request, Order $order): RedirectResponse|JsonResponse
    {
        Gate::authorize('handlePayment', $order);

        $gatewayName = $request->validated('gateway');
        $callbackUrl = route('payment.callback', ['gateway' => $gatewayName, 'order' => $order->id]);
        $outcome = $this->paymentProcessingService->initialize($order, $gatewayName, $callbackUrl);

        if (! $outcome['success']) {
            if ($request->wantsJson()) {
                return response()->json(['error' => $outcome['message']], 400);
            }

            return back()->with('error', $outcome['message']);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'reference' => $outcome['reference'],
                'authorization_url' => $outcome['authorizationUrl'],
                'inline_data' => $outcome['inlineData'],
            ]);
        }

        if ($outcome['requiresRedirect']) {
            return redirect($outcome['authorizationUrl']);
        }

        return back()->with('payment_data', [
            'reference' => $outcome['reference'],
            'inline_data' => $outcome['inlineData'],
        ]);
    }

    /**
     * Verify a payment status.
     */
    public function verify(VerifyPaymentRequest $request, Order $order): JsonResponse
    {
        Gate::authorize('handlePayment', $order);

        $outcome = $this->paymentProcessingService->verify($order, $request->validated('reference'));

        if ($outcome['error']) {
            return response()->json(['error' => $outcome['error']], 400);
        }

        return response()->json([
            'success' => $outcome['success'],
            'status' => $outcome['status'],
            'message' => $outcome['message'],
            'amount' => $outcome['amount'],
        ]);
    }

    /**
     * Get available payment gateways.
     */
    public function gateways(): JsonResponse
    {
        $gateways = [];

        foreach ($this->gatewayManager->getAvailable() as $id => $gateway) {
            $gateways[] = [
                'id' => $id,
                'name' => $gateway->getName(),
                'supports_inline' => $gateway->supportsInlinePayment(),
                'public_key' => $gateway->getPublicKey(),
            ];
        }

        return response()->json($gateways);
    }
}
