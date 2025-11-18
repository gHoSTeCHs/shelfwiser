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
 * Flutterwave payment gateway implementation.
 *
 * Supports card payments, bank transfers, mobile money, and USSD
 * across multiple African countries.
 */
class FlutterwaveGateway extends BasePaymentGateway
{
    public function getIdentifier(): string
    {
        return 'flutterwave';
    }

    public function getName(): string
    {
        return 'Flutterwave';
    }

    public function getSupportedCurrencies(): array
    {
        return ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'USD', 'EUR', 'GBP'];
    }

    public function supportsInlinePayment(): bool
    {
        return true;
    }

    public function initializePayment(Order $order, array $options = []): PaymentInitiationResult
    {
        if (!$this->isAvailable()) {
            return PaymentInitiationResult::failed('Flutterwave is not configured');
        }

        $reference = $this->generateReference($order);
        $currency = $this->getOrderCurrency($order);

        $payload = [
            'tx_ref' => $reference,
            'amount' => $order->total_amount,
            'currency' => $currency,
            'redirect_url' => $options['callback_url'] ?? $this->getCallbackUrl($order),
            'customer' => [
                'email' => $this->getCustomerEmail($order),
                'name' => $order->customer?->name ?? 'Customer',
                'phonenumber' => $order->customer?->phone ?? '',
            ],
            'customizations' => [
                'title' => config('app.name'),
                'description' => "Payment for Order #{$order->order_number}",
            ],
            'meta' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'tenant_id' => $order->tenant_id,
                ...$options['metadata'] ?? [],
            ],
        ];

        $response = $this->makeRequest('POST', '/payments', $payload);

        if (!$response['success'] || ($response['data']['status'] ?? '') !== 'success') {
            $message = $response['data']['message'] ?? 'Failed to initialize payment';
            return PaymentInitiationResult::failed($message, $reference);
        }

        $data = $response['data']['data'] ?? [];

        $this->logPaymentEvent('payment_initialized', $order, [
            'reference' => $reference,
            'amount' => $order->total_amount,
            'currency' => $currency,
        ]);

        return PaymentInitiationResult::redirect(
            reference: $reference,
            authorizationUrl: $data['link'] ?? '',
            metadata: [
                'public_key' => $this->getPublicKey(),
                'inline_data' => [
                    'public_key' => $this->getPublicKey(),
                    'tx_ref' => $reference,
                    'amount' => $order->total_amount,
                    'currency' => $currency,
                    'customer' => $payload['customer'],
                ],
            ]
        );
    }

    public function verifyPayment(string $reference): PaymentVerificationResult
    {
        if (!$this->isAvailable()) {
            return PaymentVerificationResult::failed($reference, 'Flutterwave is not configured');
        }

        $response = $this->makeRequest('GET', "/transactions/verify_by_reference?tx_ref={$reference}");

        if (!$response['success'] || ($response['data']['status'] ?? '') !== 'success') {
            return PaymentVerificationResult::failed(
                $reference,
                $response['data']['message'] ?? 'Verification failed',
                $response['data'] ?? null
            );
        }

        $data = $response['data']['data'] ?? [];
        $status = $data['status'] ?? 'failed';

        if ($status === 'successful') {
            return PaymentVerificationResult::success(
                reference: $reference,
                amount: (float) ($data['amount'] ?? 0),
                currency: $data['currency'] ?? 'NGN',
                gatewayReference: (string) ($data['id'] ?? ''),
                paymentMethod: $data['payment_type'] ?? 'card',
                channel: $data['payment_type'] ?? null,
                gatewayFee: (float) ($data['app_fee'] ?? 0),
                paidAt: $data['created_at'] ?? null,
                rawResponse: $data
            );
        }

        if ($status === 'pending') {
            return PaymentVerificationResult::pending($reference, 'Payment is pending', $data);
        }

        return PaymentVerificationResult::failed(
            $reference,
            $data['processor_response'] ?? 'Payment failed',
            $data
        );
    }

    public function refund(OrderPayment $payment, ?float $amount = null, ?string $reason = null): RefundResult
    {
        if (!$this->isAvailable()) {
            return RefundResult::failed($payment->reference_number, 'Flutterwave is not configured');
        }

        $paymentData = json_decode($payment->notes, true) ?? [];
        $transactionId = $paymentData['gateway_reference'] ?? null;

        if (!$transactionId) {
            return RefundResult::failed(
                $payment->reference_number,
                'Transaction ID not found for this payment'
            );
        }

        $payload = [
            'amount' => $amount ?? $payment->amount,
        ];

        $response = $this->makeRequest('POST', "/transactions/{$transactionId}/refund", $payload);

        if (!$response['success'] || ($response['data']['status'] ?? '') !== 'success') {
            return RefundResult::failed(
                $payment->reference_number,
                $response['data']['message'] ?? 'Refund failed',
                $response['data'] ?? null
            );
        }

        $data = $response['data']['data'] ?? [];

        return RefundResult::success(
            reference: $payment->reference_number,
            amount: (float) ($data['amount_refunded'] ?? $amount ?? $payment->amount),
            currency: $data['currency'] ?? 'NGN',
            refundReference: (string) ($data['id'] ?? ''),
            rawResponse: $data
        );
    }

    public function validateWebhook(Request $request): bool
    {
        $signature = $request->header('verif-hash');
        $webhookSecret = $this->config['webhook_secret'] ?? null;

        if (!$signature || !$webhookSecret) {
            return false;
        }

        return hash_equals($webhookSecret, $signature);
    }

    public function parseWebhook(Request $request): WebhookEvent
    {
        $payload = $request->all();
        $event = $payload['event'] ?? '';
        $data = $payload['data'] ?? [];

        $status = match ($event) {
            'charge.completed' => $data['status'] === 'successful' ? 'success' : 'failed',
            default => $data['status'] ?? 'unknown',
        };

        return new WebhookEvent(
            type: $event,
            reference: $data['tx_ref'] ?? '',
            status: $status,
            amount: (float) ($data['amount'] ?? 0),
            currency: $data['currency'] ?? 'NGN',
            gatewayReference: (string) ($data['id'] ?? ''),
            paidAt: $data['created_at'] ?? null,
            gatewayFee: (float) ($data['app_fee'] ?? 0),
            metadata: $data['meta'] ?? null,
            rawPayload: $payload,
        );
    }
}
