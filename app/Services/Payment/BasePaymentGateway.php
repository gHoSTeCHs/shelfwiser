<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Abstract base class for payment gateway implementations.
 *
 * Provides common functionality and helper methods for all gateways.
 */
abstract class BasePaymentGateway implements PaymentGatewayInterface
{
    protected array $config;

    public function __construct()
    {
        $this->config = config("services.{$this->getIdentifier()}", []);
    }

    public function isAvailable(): bool
    {
        return !empty($this->config['secret_key']);
    }

    public function supportsInlinePayment(): bool
    {
        return false;
    }

    public function supportsRefunds(): bool
    {
        return true;
    }

    public function supportsRecurring(): bool
    {
        return false;
    }

    public function getCallbackUrl(Order $order): string
    {
        return route('payment.callback', [
            'gateway' => $this->getIdentifier(),
            'order' => $order->id,
        ]);
    }

    public function getWebhookUrl(): string
    {
        return route('webhooks.' . $this->getIdentifier());
    }

    public function generateReference(Order $order): string
    {
        return strtoupper(sprintf(
            '%s_%s_%s',
            $this->getIdentifier(),
            $order->order_number,
            Str::random(8)
        ));
    }

    public function getMinimumAmount(string $currency = 'NGN'): float
    {
        return match ($currency) {
            'NGN' => 100,
            'USD' => 1,
            'GHS' => 1,
            'KES' => 100,
            'ZAR' => 10,
            default => 1,
        };
    }

    public function getMaximumAmount(string $currency = 'NGN'): ?float
    {
        return null;
    }

    public function getPublicKey(): ?string
    {
        return $this->config['public_key'] ?? null;
    }

    /**
     * Convert amount to smallest currency unit (e.g., kobo, cents).
     */
    protected function toSmallestUnit(float $amount, string $currency = 'NGN'): int
    {
        $multiplier = match ($currency) {
            'JPY', 'KRW' => 1,
            default => 100,
        };

        return (int) round($amount * $multiplier);
    }

    /**
     * Convert from smallest currency unit to standard amount.
     */
    protected function fromSmallestUnit(int $amount, string $currency = 'NGN'): float
    {
        $divisor = match ($currency) {
            'JPY', 'KRW' => 1,
            default => 100,
        };

        return $amount / $divisor;
    }

    /**
     * Make an HTTP request to the gateway API.
     */
    protected function makeRequest(
        string $method,
        string $endpoint,
        array $data = [],
        array $headers = []
    ): array {
        $baseUrl = $this->config['base_url'] ?? $this->config['payment_url'] ?? '';
        $url = rtrim($baseUrl, '/') . '/' . ltrim($endpoint, '/');

        $defaultHeaders = [
            'Authorization' => 'Bearer ' . ($this->config['secret_key'] ?? ''),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        $headers = array_merge($defaultHeaders, $headers);

        try {
            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->{strtolower($method)}($url, $data);

            $responseData = $response->json() ?? [];

            if (!$response->successful()) {
                Log::error("Payment gateway request failed", [
                    'gateway' => $this->getIdentifier(),
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'response' => $responseData,
                ]);
            }

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'data' => $responseData,
            ];
        } catch (\Exception $e) {
            Log::error("Payment gateway request exception", [
                'gateway' => $this->getIdentifier(),
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 500,
                'data' => ['message' => $e->getMessage()],
            ];
        }
    }

    /**
     * Log a payment event for audit purposes.
     */
    protected function logPaymentEvent(
        string $event,
        Order $order,
        array $data = []
    ): void {
        Log::info("Payment event: {$event}", [
            'gateway' => $this->getIdentifier(),
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'tenant_id' => $order->tenant_id,
            ...$data,
        ]);
    }

    /**
     * Create an OrderPayment record from verification result.
     */
    protected function createPaymentRecord(
        Order $order,
        string $reference,
        float $amount,
        string $gatewayReference,
        ?float $gatewayFee = null,
        ?array $rawResponse = null
    ): OrderPayment {
        return OrderPayment::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'amount' => $amount,
            'payment_method' => $this->getIdentifier(),
            'payment_date' => now(),
            'reference_number' => $reference,
            'notes' => json_encode([
                'gateway' => $this->getIdentifier(),
                'gateway_reference' => $gatewayReference,
                'gateway_fee' => $gatewayFee,
                'raw_response' => $rawResponse,
            ]),
            'recorded_by' => null,
        ]);
    }

    /**
     * Find order by payment reference in metadata.
     */
    protected function findOrderByReference(string $reference): ?Order
    {
        $parts = explode('_', $reference);

        if (count($parts) >= 2) {
            $orderNumber = $parts[1];
            return Order::where('order_number', $orderNumber)->first();
        }

        return null;
    }

    /**
     * Get customer email for payment.
     */
    protected function getCustomerEmail(Order $order): string
    {
        return $order->customer?->email ?? $order->billing_email ?? 'customer@example.com';
    }

    /**
     * Get shop currency for payment.
     */
    protected function getOrderCurrency(Order $order): string
    {
        return $order->shop?->currency ?? 'NGN';
    }
}
