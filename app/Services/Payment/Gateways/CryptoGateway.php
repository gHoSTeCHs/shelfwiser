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
 * Cryptocurrency payment gateway implementation.
 *
 * Supports Bitcoin, Ethereum, USDT, and other cryptocurrencies
 * through NOWPayments or similar providers.
 */
class CryptoGateway extends BasePaymentGateway
{
    public function getIdentifier(): string
    {
        return 'crypto';
    }

    public function getName(): string
    {
        return 'Cryptocurrency';
    }

    public function getSupportedCurrencies(): array
    {
        return ['USD', 'EUR', 'NGN', 'GBP'];
    }

    public function supportsRefunds(): bool
    {
        return false;
    }

    public function initializePayment(Order $order, array $options = []): PaymentInitiationResult
    {
        if (!$this->isAvailable()) {
            return PaymentInitiationResult::failed('Crypto payments are not configured');
        }

        $reference = $this->generateReference($order);
        $currency = $this->getOrderCurrency($order);
        $payCurrency = $options['pay_currency'] ?? 'btc';

        $payload = [
            'price_amount' => $order->total_amount,
            'price_currency' => strtolower($currency),
            'pay_currency' => $payCurrency,
            'ipn_callback_url' => $this->getWebhookUrl(),
            'order_id' => $reference,
            'order_description' => "Order #{$order->order_number}",
        ];

        $response = $this->makeRequest('POST', '/payment', $payload, [
            'x-api-key' => $this->config['api_key'] ?? '',
        ]);

        if (!$response['success']) {
            $message = $response['data']['message'] ?? 'Failed to create crypto payment';
            return PaymentInitiationResult::failed($message, $reference);
        }

        $data = $response['data'] ?? [];

        $this->logPaymentEvent('payment_initialized', $order, [
            'reference' => $reference,
            'amount' => $order->total_amount,
            'pay_currency' => $payCurrency,
        ]);

        return PaymentInitiationResult::crypto(
            reference: $reference,
            walletAddress: $data['pay_address'] ?? '',
            cryptoAmount: (float) ($data['pay_amount'] ?? 0),
            cryptoCurrency: strtoupper($payCurrency),
            qrCode: $data['qr_code'] ?? null,
            expiresAt: isset($data['expiration_estimate_date'])
                ? strtotime($data['expiration_estimate_date'])
                : time() + 1800,
            metadata: [
                'payment_id' => $data['payment_id'] ?? null,
                'payment_url' => $data['invoice_url'] ?? null,
            ]
        );
    }

    public function verifyPayment(string $reference): PaymentVerificationResult
    {
        if (!$this->isAvailable()) {
            return PaymentVerificationResult::failed($reference, 'Crypto payments are not configured');
        }

        $response = $this->makeRequest('GET', "/payment/{$reference}", [], [
            'x-api-key' => $this->config['api_key'] ?? '',
        ]);

        if (!$response['success']) {
            return PaymentVerificationResult::failed(
                $reference,
                $response['data']['message'] ?? 'Verification request failed',
                $response['data'] ?? null
            );
        }

        $data = $response['data'] ?? [];
        $status = $data['payment_status'] ?? 'waiting';

        if (in_array($status, ['finished', 'confirmed'])) {
            return PaymentVerificationResult::success(
                reference: $reference,
                amount: (float) ($data['price_amount'] ?? 0),
                currency: strtoupper($data['price_currency'] ?? 'USD'),
                gatewayReference: $data['payment_id'] ?? $reference,
                paymentMethod: 'crypto_' . ($data['pay_currency'] ?? 'btc'),
                rawResponse: $data
            );
        }

        if (in_array($status, ['waiting', 'confirming', 'sending'])) {
            return PaymentVerificationResult::pending(
                $reference,
                "Payment status: {$status}",
                $data
            );
        }

        return PaymentVerificationResult::failed(
            $reference,
            "Payment {$status}",
            $data
        );
    }

    public function refund(OrderPayment $payment, ?float $amount = null, ?string $reason = null): RefundResult
    {
        return RefundResult::failed(
            $payment->reference_number,
            'Cryptocurrency payments cannot be refunded automatically. Please process manually.'
        );
    }

    public function validateWebhook(Request $request): bool
    {
        $signature = $request->header('x-nowpayments-sig');
        $ipnSecret = $this->config['ipn_secret'] ?? $this->config['webhook_secret'] ?? null;

        if (!$signature || !$ipnSecret) {
            return false;
        }

        $payload = $request->all();
        ksort($payload);
        $sortedPayload = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $computedSignature = hash_hmac('sha512', $sortedPayload, $ipnSecret);

        return hash_equals($computedSignature, $signature);
    }

    public function parseWebhook(Request $request): WebhookEvent
    {
        $payload = $request->all();

        $status = match ($payload['payment_status'] ?? '') {
            'finished', 'confirmed' => 'success',
            'failed', 'expired', 'refunded' => 'failed',
            default => 'pending',
        };

        return new WebhookEvent(
            type: 'payment.' . $status,
            reference: $payload['order_id'] ?? '',
            status: $status,
            amount: (float) ($payload['price_amount'] ?? 0),
            currency: strtoupper($payload['price_currency'] ?? 'USD'),
            gatewayReference: (string) ($payload['payment_id'] ?? ''),
            metadata: [
                'pay_amount' => $payload['pay_amount'] ?? null,
                'pay_currency' => $payload['pay_currency'] ?? null,
                'actually_paid' => $payload['actually_paid'] ?? null,
            ],
            rawPayload: $payload,
        );
    }
}
