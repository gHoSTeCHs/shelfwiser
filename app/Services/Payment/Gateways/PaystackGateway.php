<?php

namespace App\Services\Payment\Gateways;

use App\DTOs\Payment\PaymentInitiationResult;
use App\DTOs\Payment\PaymentVerificationResult;
use App\DTOs\Payment\RefundResult;
use App\DTOs\Payment\WebhookEvent;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\Payment\BasePaymentGateway;
use Illuminate\Http\Request;

/**
 * Paystack payment gateway implementation.
 *
 * Supports card payments, bank transfers, USSD, and mobile money
 * for Nigerian Naira (NGN) and other African currencies.
 */
class PaystackGateway extends BasePaymentGateway
{
    public function getIdentifier(): string
    {
        return 'paystack';
    }

    public function getName(): string
    {
        return 'Paystack';
    }

    public function getSupportedCurrencies(): array
    {
        return ['NGN', 'GHS', 'ZAR', 'USD'];
    }

    public function supportsInlinePayment(): bool
    {
        return true;
    }

    public function initializePayment(Order $order, array $options = []): PaymentInitiationResult
    {
        if (! $this->isAvailable()) {
            return PaymentInitiationResult::failed('Paystack is not configured');
        }

        $reference = $this->generateReference($order);
        $currency = $this->getOrderCurrency($order);
        $amount = $this->toSmallestUnit($order->total_amount, $currency);

        $payload = [
            'email' => $this->getCustomerEmail($order),
            'amount' => $amount,
            'currency' => $currency,
            'reference' => $reference,
            'callback_url' => $options['callback_url'] ?? $this->getCallbackUrl($order),
            'metadata' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'tenant_id' => $order->tenant_id,
                'shop_id' => $order->shop_id,
                'custom_fields' => [
                    [
                        'display_name' => 'Order Number',
                        'variable_name' => 'order_number',
                        'value' => $order->order_number,
                    ],
                ],
                ...$options['metadata'] ?? [],
            ],
        ];

        if (isset($options['channels'])) {
            $payload['channels'] = $options['channels'];
        }

        $response = $this->makeRequest('POST', '/transaction/initialize', $payload);

        if (! $response['success'] || ! ($response['data']['status'] ?? false)) {
            $message = $response['data']['message'] ?? 'Failed to initialize payment';

            return PaymentInitiationResult::failed($message, $reference);
        }

        $data = $response['data']['data'];

        $this->logPaymentEvent('payment_initialized', $order, [
            'reference' => $reference,
            'amount' => $order->total_amount,
            'currency' => $currency,
        ]);

        return PaymentInitiationResult::redirect(
            reference: $reference,
            authorizationUrl: $data['authorization_url'],
            accessCode: $data['access_code'],
            metadata: [
                'public_key' => $this->getPublicKey(),
                'inline_data' => [
                    'key' => $this->getPublicKey(),
                    'email' => $this->getCustomerEmail($order),
                    'amount' => $amount,
                    'currency' => $currency,
                    'ref' => $reference,
                ],
            ]
        );
    }

    public function verifyPayment(string $reference): PaymentVerificationResult
    {
        if (! $this->isAvailable()) {
            return PaymentVerificationResult::failed($reference, 'Paystack is not configured');
        }

        $response = $this->makeRequest('GET', "/transaction/verify/{$reference}");

        if (! $response['success']) {
            return PaymentVerificationResult::failed(
                $reference,
                $response['data']['message'] ?? 'Verification request failed',
                $response['data'] ?? null
            );
        }

        $data = $response['data']['data'] ?? [];
        $status = $data['status'] ?? 'failed';

        if ($status === 'success') {
            $currency = $data['currency'] ?? 'NGN';

            return PaymentVerificationResult::success(
                reference: $reference,
                amount: $this->fromSmallestUnit($data['amount'], $currency),
                currency: $currency,
                gatewayReference: $data['id'] ?? $reference,
                paymentMethod: $data['channel'] ?? 'card',
                channel: $data['channel'] ?? null,
                gatewayFee: isset($data['fees']) ? $this->fromSmallestUnit($data['fees'], $currency) : null,
                paidAt: $data['paid_at'] ?? null,
                rawResponse: $data
            );
        }

        if ($status === 'pending' || $status === 'ongoing') {
            return PaymentVerificationResult::pending(
                $reference,
                'Payment is still being processed',
                $data
            );
        }

        return PaymentVerificationResult::failed(
            $reference,
            $data['gateway_response'] ?? 'Payment failed',
            $data
        );
    }

    public function refund(OrderPayment $payment, ?float $amount = null, ?string $reason = null): RefundResult
    {
        if (! $this->isAvailable()) {
            return RefundResult::failed($payment->reference_number, 'Paystack is not configured');
        }

        $paymentData = json_decode($payment->notes, true) ?? [];
        $gatewayReference = $paymentData['gateway_reference'] ?? null;

        if (! $gatewayReference) {
            return RefundResult::failed(
                $payment->reference_number,
                'Gateway reference not found for this payment'
            );
        }

        $payload = [
            'transaction' => $gatewayReference,
        ];

        if ($amount !== null) {
            $currency = $payment->order->shop->currency ?? 'NGN';
            $payload['amount'] = $this->toSmallestUnit($amount, $currency);
        }

        $response = $this->makeRequest('POST', '/refund', $payload);

        if (! $response['success'] || ! ($response['data']['status'] ?? false)) {
            return RefundResult::failed(
                $payment->reference_number,
                $response['data']['message'] ?? 'Refund request failed',
                $response['data'] ?? null
            );
        }

        $data = $response['data']['data'] ?? [];
        $currency = $data['currency'] ?? 'NGN';

        return RefundResult::success(
            reference: $payment->reference_number,
            amount: $this->fromSmallestUnit($data['amount'], $currency),
            currency: $currency,
            refundReference: $data['id'] ?? '',
            rawResponse: $data
        );
    }

    public function validateWebhook(Request $request): bool
    {
        $signature = $request->header('x-paystack-signature');
        $webhookSecret = $this->config['webhook_secret'] ?? null;

        if (! $signature || ! $webhookSecret) {
            return false;
        }

        $computedSignature = hash_hmac('sha512', $request->getContent(), $webhookSecret);

        return hash_equals($computedSignature, $signature);
    }

    public function parseWebhook(Request $request): WebhookEvent
    {
        $payload = $request->all();
        $event = $payload['event'] ?? '';
        $data = $payload['data'] ?? [];

        $status = match ($event) {
            'charge.success' => 'success',
            'charge.failed' => 'failed',
            default => $data['status'] ?? 'unknown',
        };

        $currency = $data['currency'] ?? 'NGN';

        return new WebhookEvent(
            type: $event,
            reference: $data['reference'] ?? '',
            status: $status,
            amount: isset($data['amount']) ? $this->fromSmallestUnit($data['amount'], $currency) : null,
            currency: $currency,
            gatewayReference: (string) ($data['id'] ?? ''),
            paidAt: $data['paid_at'] ?? null,
            gatewayFee: isset($data['fees']) ? $this->fromSmallestUnit($data['fees'], $currency) : null,
            metadata: $data['metadata'] ?? null,
            rawPayload: $payload,
        );
    }
}
