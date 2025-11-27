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
 * OPay payment gateway implementation.
 *
 * Supports card payments, bank transfers, USSD, and OPay wallet
 * for Nigerian Naira (NGN).
 */
class OpayGateway extends BasePaymentGateway
{
    public function getIdentifier(): string
    {
        return 'opay';
    }

    public function getName(): string
    {
        return 'OPay';
    }

    public function getSupportedCurrencies(): array
    {
        return ['NGN'];
    }

    public function initializePayment(Order $order, array $options = []): PaymentInitiationResult
    {
        if (! $this->isAvailable()) {
            return PaymentInitiationResult::failed('OPay is not configured');
        }

        $reference = $this->generateReference($order);
        $amount = $this->toSmallestUnit($order->total_amount, 'NGN');

        $payload = [
            'reference' => $reference,
            'mchShortName' => config('app.name'),
            'productName' => "Order #{$order->order_number}",
            'productDesc' => "Payment for order {$order->order_number}",
            'userPhone' => $order->customer?->phone ?? '',
            'userRequestIp' => request()->ip(),
            'amount' => (string) $amount,
            'currency' => 'NGN',
            'callbackUrl' => $options['callback_url'] ?? $this->getCallbackUrl($order),
            'returnUrl' => $options['return_url'] ?? $this->getCallbackUrl($order),
            'expireAt' => (string) (time() + 1800),
        ];

        $response = $this->makeRequest('POST', '/api/v3/cashier/initialize', $payload);

        if (! $response['success'] || ($response['data']['code'] ?? '') !== '00000') {
            $message = $response['data']['message'] ?? 'Failed to initialize OPay payment';

            return PaymentInitiationResult::failed($message, $reference);
        }

        $data = $response['data']['data'] ?? [];

        $this->logPaymentEvent('payment_initialized', $order, [
            'reference' => $reference,
            'amount' => $order->total_amount,
        ]);

        return PaymentInitiationResult::redirect(
            reference: $reference,
            authorizationUrl: $data['cashierUrl'] ?? '',
            metadata: ['order_no' => $data['orderNo'] ?? '']
        );
    }

    public function verifyPayment(string $reference): PaymentVerificationResult
    {
        if (! $this->isAvailable()) {
            return PaymentVerificationResult::failed($reference, 'OPay is not configured');
        }

        $payload = [
            'reference' => $reference,
        ];

        $response = $this->makeRequest('POST', '/api/v3/cashier/status', $payload);

        if (! $response['success']) {
            return PaymentVerificationResult::failed(
                $reference,
                $response['data']['message'] ?? 'Verification request failed',
                $response['data'] ?? null
            );
        }

        $data = $response['data']['data'] ?? [];
        $status = $data['status'] ?? 'FAIL';

        if ($status === 'SUCCESS') {
            return PaymentVerificationResult::success(
                reference: $reference,
                amount: $this->fromSmallestUnit((int) ($data['amount'] ?? 0), 'NGN'),
                currency: 'NGN',
                gatewayReference: $data['orderNo'] ?? $reference,
                paymentMethod: 'opay',
                rawResponse: $data
            );
        }

        if ($status === 'PENDING' || $status === 'INITIAL') {
            return PaymentVerificationResult::pending($reference, 'Payment is being processed', $data);
        }

        return PaymentVerificationResult::failed(
            $reference,
            $data['failureReason'] ?? 'Payment failed',
            $data
        );
    }

    public function refund(OrderPayment $payment, ?float $amount = null, ?string $reason = null): RefundResult
    {
        return RefundResult::failed(
            $payment->reference_number,
            'OPay refunds must be processed through the OPay merchant dashboard'
        );
    }

    public function validateWebhook(Request $request): bool
    {
        $signature = $request->header('Authorization');
        $webhookSecret = $this->config['webhook_secret'] ?? null;

        if (! $signature || ! $webhookSecret) {
            return false;
        }

        $computedSignature = hash_hmac('sha512', $request->getContent(), $webhookSecret);

        return hash_equals("Bearer {$computedSignature}", $signature);
    }

    public function parseWebhook(Request $request): WebhookEvent
    {
        $payload = $request->all();
        $data = $payload['payload'] ?? $payload;

        $status = match ($data['status'] ?? '') {
            'SUCCESS' => 'success',
            'FAIL' => 'failed',
            default => 'pending',
        };

        return new WebhookEvent(
            type: 'payment.'.$status,
            reference: $data['reference'] ?? '',
            status: $status,
            amount: isset($data['amount']) ? $this->fromSmallestUnit((int) $data['amount'], 'NGN') : null,
            currency: 'NGN',
            gatewayReference: $data['orderNo'] ?? '',
            rawPayload: $payload,
        );
    }
}
