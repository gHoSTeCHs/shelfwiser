<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\Payment\PaymentGatewayManager;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function __construct(
        protected PaymentGatewayManager $gatewayManager
    ) {}

    /**
     * Handle webhook from any payment gateway.
     */
    public function handle(Request $request, string $gateway): Response
    {
        try {
            $paymentGateway = $this->gatewayManager->gateway($gateway);
        } catch (\Exception $e) {
            Log::error("Unknown payment gateway webhook: {$gateway}");

            return response('Unknown gateway', 400);
        }

        if (! $paymentGateway->validateWebhook($request)) {
            Log::warning("Invalid webhook signature for {$gateway}");

            return response('Invalid signature', 401);
        }

        $event = $paymentGateway->parseWebhook($request);

        Log::info('Payment webhook received', [
            'gateway' => $gateway,
            'type' => $event->type,
            'reference' => $event->reference,
            'status' => $event->status,
        ]);

        if ($event->isSuccessfulCharge()) {
            $this->handleSuccessfulPayment($gateway, $event);
        } elseif ($event->isFailedCharge()) {
            $this->handleFailedPayment($gateway, $event);
        }

        return response('OK', 200);
    }

    /**
     * Handle successful payment webhook.
     */
    protected function handleSuccessfulPayment(string $gateway, $event): void
    {
        $existingPayment = OrderPayment::where('reference_number', $event->reference)->first();

        if ($existingPayment) {
            if ($existingPayment->gateway_status !== 'success') {
                $existingPayment->update([
                    'gateway_status' => 'success',
                    'gateway_response' => $event->rawPayload,
                    'verified_at' => now(),
                ]);
            }

            return;
        }

        $order = $this->findOrderByReference($event->reference);

        if (! $order) {
            Log::warning('Order not found for webhook', [
                'gateway' => $gateway,
                'reference' => $event->reference,
            ]);

            return;
        }

        OrderPayment::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'amount' => $event->amount,
            'currency' => $event->currency ?? 'NGN',
            'gateway_fee' => $event->gatewayFee ?? 0,
            'payment_method' => $gateway,
            'gateway' => $gateway,
            'gateway_reference' => $event->gatewayReference,
            'gateway_status' => 'success',
            'gateway_response' => $event->rawPayload,
            'verified_at' => now(),
            'payment_date' => $event->paidAt ? date('Y-m-d', strtotime($event->paidAt)) : now(),
            'reference_number' => $event->reference,
            'notes' => 'Webhook payment confirmation',
            'recorded_by' => null,
        ]);
    }

    /**
     * Handle failed payment webhook.
     */
    protected function handleFailedPayment(string $gateway, $event): void
    {
        $existingPayment = OrderPayment::where('reference_number', $event->reference)->first();

        if ($existingPayment) {
            $existingPayment->update([
                'gateway_status' => 'failed',
                'gateway_response' => $event->rawPayload,
            ]);
        }

        $order = $this->findOrderByReference($event->reference);

        if ($order && $order->payment_reference === $event->reference) {
            Log::info('Payment failed for order', [
                'order_id' => $order->id,
                'reference' => $event->reference,
            ]);
        }
    }

    /**
     * Find order by payment reference.
     */
    protected function findOrderByReference(string $reference): ?Order
    {
        $order = Order::where('payment_reference', $reference)->first();

        if ($order) {
            return $order;
        }

        $parts = explode('_', $reference);
        if (count($parts) >= 2) {
            return Order::where('order_number', $parts[1])->first();
        }

        return null;
    }
}
