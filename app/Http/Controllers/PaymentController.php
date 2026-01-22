<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\Payment\PaymentGatewayManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentGatewayManager $gatewayManager
    ) {}

    /**
     * Handle payment gateway callback/redirect.
     */
    public function callback(Request $request, string $gatewayName, Order $order): RedirectResponse
    {
        // Verify tenant ownership if user is authenticated
        if (auth()->check() && $order->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access to order');
        }

        $gateway = $this->gatewayManager->gateway($gatewayName);
        $reference = $request->get('reference') ?? $request->get('tx_ref') ?? $order->payment_reference;

        if (! $reference) {
            return redirect()
                ->route('orders.show', $order)
                ->with('error', 'Payment reference not found');
        }

        $result = $gateway->verifyPayment($reference);

        if ($result->isSuccessful()) {
            $existingPayment = OrderPayment::where('reference_number', $reference)->first();

            if (! $existingPayment) {
                OrderPayment::create([
                    'order_id' => $order->id,
                    'tenant_id' => $order->tenant_id,
                    'shop_id' => $order->shop_id,
                    'amount' => $result->amount,
                    'currency' => $result->currency ?? 'NGN',
                    'gateway_fee' => $result->gatewayFee ?? 0,
                    'payment_method' => $result->paymentMethod ?? $gatewayName,
                    'gateway' => $gatewayName,
                    'gateway_reference' => $result->gatewayReference,
                    'gateway_status' => 'success',
                    'gateway_response' => $result->rawResponse,
                    'verified_at' => now(),
                    'payment_date' => now(),
                    'reference_number' => $reference,
                    'notes' => "Payment via {$gateway->getName()}",
                    'recorded_by' => null,
                ]);
            }

            return redirect()
                ->route('orders.show', $order)
                ->with('success', 'Payment completed successfully');
        }

        if ($result->isPending()) {
            return redirect()
                ->route('orders.show', $order)
                ->with('info', 'Payment is being processed. You will be notified once confirmed.');
        }

        return redirect()
            ->route('orders.show', $order)
            ->with('error', $result->message ?? 'Payment failed');
    }

    /**
     * Initialize a payment for an order.
     */
    public function initialize(Request $request, Order $order): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        // Verify tenant ownership
        if (auth()->check() && $order->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access to order');
        }

        $validated = $request->validate([
            'gateway' => ['required', 'string'],
        ]);

        $gateway = $this->gatewayManager->gateway($validated['gateway']);

        if (! $gateway->isAvailable()) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Payment gateway not available'], 400);
            }

            return back()->with('error', 'Payment gateway not available');
        }

        $result = $gateway->initializePayment($order, [
            'callback_url' => route('payment.callback', [
                'gateway' => $validated['gateway'],
                'order' => $order->id,
            ]),
        ]);

        if (! $result->success) {
            if ($request->wantsJson()) {
                return response()->json(['error' => $result->message], 400);
            }

            return back()->with('error', $result->message ?? 'Failed to initialize payment');
        }

        $order->update([
            'payment_gateway' => $validated['gateway'],
            'payment_reference' => $result->reference,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'reference' => $result->reference,
                'authorization_url' => $result->authorizationUrl,
                'inline_data' => $result->metadata['inline_data'] ?? null,
            ]);
        }

        if ($result->requiresRedirect()) {
            return redirect($result->authorizationUrl);
        }

        return back()->with('payment_data', [
            'reference' => $result->reference,
            'inline_data' => $result->metadata['inline_data'] ?? null,
        ]);
    }

    /**
     * Verify a payment status.
     */
    public function verify(Request $request, Order $order): \Illuminate\Http\JsonResponse
    {
        // Verify tenant ownership
        if (auth()->check() && $order->tenant_id !== auth()->user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized access to order'], 403);
        }

        $reference = $request->get('reference') ?? $order->payment_reference;

        if (! $reference || ! $order->payment_gateway) {
            return response()->json(['error' => 'No payment to verify'], 400);
        }

        $gateway = $this->gatewayManager->gateway($order->payment_gateway);
        $result = $gateway->verifyPayment($reference);

        return response()->json([
            'success' => $result->isSuccessful(),
            'status' => $result->status,
            'message' => $result->message,
            'amount' => $result->amount,
        ]);
    }

    /**
     * Get available payment gateways.
     */
    public function gateways(): \Illuminate\Http\JsonResponse
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
