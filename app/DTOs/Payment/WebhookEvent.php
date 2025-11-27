<?php

namespace App\DTOs\Payment;

/**
 * Parsed webhook event from a payment gateway.
 */
class WebhookEvent
{
    public function __construct(
        public readonly string $type,
        public readonly string $reference,
        public readonly string $status,
        public readonly ?float $amount = null,
        public readonly ?string $currency = null,
        public readonly ?string $gatewayReference = null,
        public readonly ?string $paidAt = null,
        public readonly ?float $gatewayFee = null,
        public readonly ?array $metadata = null,
        public readonly ?array $rawPayload = null,
    ) {}

    /**
     * Check if this is a successful charge event.
     */
    public function isSuccessfulCharge(): bool
    {
        return in_array($this->type, ['charge.success', 'payment.success', 'transaction.successful'])
            && $this->status === 'success';
    }

    /**
     * Check if this is a failed charge event.
     */
    public function isFailedCharge(): bool
    {
        return in_array($this->type, ['charge.failed', 'payment.failed', 'transaction.failed']);
    }

    /**
     * Check if this is a refund event.
     */
    public function isRefund(): bool
    {
        return str_contains($this->type, 'refund');
    }

    /**
     * Check if this is a transfer event.
     */
    public function isTransfer(): bool
    {
        return str_contains($this->type, 'transfer');
    }
}
