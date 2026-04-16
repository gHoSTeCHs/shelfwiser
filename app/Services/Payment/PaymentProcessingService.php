<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentProcessingService
{
    public function __construct(
        private readonly PaymentGatewayManager $gatewayManager,
    ) {}

    /**
     * Handle a gateway callback: verify reference, record payment idempotently.
     *
     * @return array{status: 'success'|'pending'|'failed'|'missing_reference', message: ?string}
     */
    public function handleCallback(Order $order, string $gatewayName, ?string $reference): array
    {
        $gateway = $this->gatewayManager->gateway($gatewayName);
        $reference = $reference ?: $order->payment_reference;

        if (! $reference) {
            return ['status' => 'missing_reference', 'message' => 'Payment reference not found'];
        }

        $result = $gateway->verifyPayment($reference);

        if ($result->isSuccessful()) {
            $this->recordSuccessfulPayment($order, $gatewayName, $gateway->getName(), $reference, $result);

            return ['status' => 'success', 'message' => 'Payment completed successfully'];
        }

        if ($result->isPending()) {
            return [
                'status' => 'pending',
                'message' => 'Payment is being processed. You will be notified once confirmed.',
            ];
        }

        return ['status' => 'failed', 'message' => $result->message ?? 'Payment failed'];
    }

    /**
     * Initialize a payment with the selected gateway.
     *
     * @return array{
     *     success: bool,
     *     gatewayAvailable: bool,
     *     reference: ?string,
     *     authorizationUrl: ?string,
     *     inlineData: mixed,
     *     requiresRedirect: bool,
     *     message: ?string
     * }
     */
    public function initialize(Order $order, string $gatewayName, string $callbackUrl): array
    {
        $gateway = $this->gatewayManager->gateway($gatewayName);

        if (! $gateway->isAvailable()) {
            return [
                'success' => false,
                'gatewayAvailable' => false,
                'reference' => null,
                'authorizationUrl' => null,
                'inlineData' => null,
                'requiresRedirect' => false,
                'message' => 'Payment gateway not available',
            ];
        }

        $result = $gateway->initializePayment($order, ['callback_url' => $callbackUrl]);

        if (! $result->success) {
            return [
                'success' => false,
                'gatewayAvailable' => true,
                'reference' => null,
                'authorizationUrl' => null,
                'inlineData' => null,
                'requiresRedirect' => false,
                'message' => $result->message ?? 'Failed to initialize payment',
            ];
        }

        $order->update([
            'payment_gateway' => $gatewayName,
            'payment_reference' => $result->reference,
        ]);

        return [
            'success' => true,
            'gatewayAvailable' => true,
            'reference' => $result->reference,
            'authorizationUrl' => $result->authorizationUrl,
            'inlineData' => $result->metadata['inline_data'] ?? null,
            'requiresRedirect' => $result->requiresRedirect(),
            'message' => null,
        ];
    }

    /**
     * Verify a payment's current status via the gateway.
     *
     * @return array{success: bool, status: ?string, message: ?string, amount: ?float, error: ?string}
     */
    public function verify(Order $order, ?string $reference): array
    {
        $reference = $reference ?: $order->payment_reference;

        if (! $reference || ! $order->payment_gateway) {
            return [
                'success' => false,
                'status' => null,
                'message' => null,
                'amount' => null,
                'error' => 'No payment to verify',
            ];
        }

        $gateway = $this->gatewayManager->gateway($order->payment_gateway);
        $result = $gateway->verifyPayment($reference);

        return [
            'success' => $result->isSuccessful(),
            'status' => $result->status,
            'message' => $result->message,
            'amount' => $result->amount,
            'error' => null,
        ];
    }

    /**
     * Record a verified payment with pessimistic locking and idempotency checks.
     */
    private function recordSuccessfulPayment(
        Order $order,
        string $gatewayName,
        string $gatewayDisplayName,
        string $reference,
        \App\DTOs\Payment\PaymentVerificationResult $result,
    ): void {
        DB::transaction(function () use ($order, $gatewayName, $gatewayDisplayName, $reference, $result) {
            $lockedOrder = Order::query()->where('id', $order->id)->lockForUpdate()->first();

            if ($lockedOrder->payment_reference && $lockedOrder->payment_reference !== $reference) {
                Log::warning('Payment reference mismatch', [
                    'order_id' => $lockedOrder->id,
                    'expected' => $lockedOrder->payment_reference,
                    'received' => $reference,
                ]);

                return;
            }

            if (OrderPayment::query()->where('reference_number', $reference)->exists()) {
                return;
            }

            if ($result->amount < $lockedOrder->remainingBalance() * 0.99) {
                Log::warning('Payment amount less than expected', [
                    'order_id' => $lockedOrder->id,
                    'expected' => $lockedOrder->remainingBalance(),
                    'received' => $result->amount,
                ]);
            }

            OrderPayment::query()->create([
                'order_id' => $lockedOrder->id,
                'tenant_id' => $lockedOrder->tenant_id,
                'shop_id' => $lockedOrder->shop_id,
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
                'notes' => "Payment via {$gatewayDisplayName}",
                'recorded_by' => null,
            ]);
        });
    }
}
