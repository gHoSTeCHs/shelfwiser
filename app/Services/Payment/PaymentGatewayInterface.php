<?php

namespace App\Services\Payment;

use App\DTOs\Payment\PaymentInitiationResult;
use App\DTOs\Payment\PaymentVerificationResult;
use App\DTOs\Payment\RefundResult;
use App\DTOs\Payment\WebhookEvent;
use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Http\Request;

/**
 * Interface for payment gateway implementations.
 *
 * All payment gateways (Paystack, OPay, Crypto, etc.) must implement this interface
 * to ensure consistent payment handling across the application.
 */
interface PaymentGatewayInterface
{
    /**
     * Get the gateway identifier.
     *
     * @return string Unique identifier (e.g., 'paystack', 'opay', 'crypto')
     */
    public function getIdentifier(): string;

    /**
     * Get the display name for the gateway.
     *
     * @return string Human-readable name
     */
    public function getName(): string;

    /**
     * Check if the gateway is properly configured and available.
     *
     * @return bool True if gateway is configured and ready
     */
    public function isAvailable(): bool;

    /**
     * Get supported currencies for this gateway.
     *
     * @return array<string> Array of currency codes (e.g., ['NGN', 'USD', 'GHS'])
     */
    public function getSupportedCurrencies(): array;

    /**
     * Check if gateway supports inline/embedded payments.
     *
     * @return bool True if inline payments are supported
     */
    public function supportsInlinePayment(): bool;

    /**
     * Check if gateway supports refunds.
     *
     * @return bool True if refunds are supported
     */
    public function supportsRefunds(): bool;

    /**
     * Check if gateway supports recurring payments.
     *
     * @return bool True if subscriptions/recurring payments are supported
     */
    public function supportsRecurring(): bool;

    /**
     * Initialize a payment transaction.
     *
     * @param Order $order The order to be paid
     * @param array $options Additional options (callback_url, metadata, etc.)
     * @return PaymentInitiationResult Result containing authorization URL or inline data
     */
    public function initializePayment(Order $order, array $options = []): PaymentInitiationResult;

    /**
     * Verify a payment transaction.
     *
     * @param string $reference The payment reference to verify
     * @return PaymentVerificationResult Verification result with transaction details
     */
    public function verifyPayment(string $reference): PaymentVerificationResult;

    /**
     * Process a refund for a completed payment.
     *
     * @param OrderPayment $payment The payment to refund
     * @param float|null $amount Amount to refund (null for full refund)
     * @param string|null $reason Reason for the refund
     * @return RefundResult Refund processing result
     */
    public function refund(OrderPayment $payment, ?float $amount = null, ?string $reason = null): RefundResult;

    /**
     * Validate and parse a webhook request.
     *
     * @param Request $request The incoming webhook request
     * @return bool True if webhook signature is valid
     */
    public function validateWebhook(Request $request): bool;

    /**
     * Parse a webhook payload into a structured event.
     *
     * @param Request $request The webhook request
     * @return WebhookEvent Parsed webhook event
     */
    public function parseWebhook(Request $request): WebhookEvent;

    /**
     * Get the callback URL for payment redirects.
     *
     * @param Order $order The order being paid
     * @return string The callback URL
     */
    public function getCallbackUrl(Order $order): string;

    /**
     * Get the webhook URL for this gateway.
     *
     * @return string The webhook URL
     */
    public function getWebhookUrl(): string;

    /**
     * Generate a unique payment reference.
     *
     * @param Order $order The order
     * @return string Unique reference string
     */
    public function generateReference(Order $order): string;

    /**
     * Get minimum transaction amount in the base currency.
     *
     * @param string $currency Currency code
     * @return float Minimum amount
     */
    public function getMinimumAmount(string $currency = 'NGN'): float;

    /**
     * Get maximum transaction amount in the base currency.
     *
     * @param string $currency Currency code
     * @return float|null Maximum amount or null if no limit
     */
    public function getMaximumAmount(string $currency = 'NGN'): ?float;

    /**
     * Get the public key for client-side integration.
     *
     * @return string|null Public key or null if not applicable
     */
    public function getPublicKey(): ?string;
}
