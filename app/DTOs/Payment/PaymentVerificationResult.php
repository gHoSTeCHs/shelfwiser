<?php

namespace App\DTOs\Payment;

/**
 * Result of verifying a payment with a gateway.
 *
 * Contains verification status and transaction details from the gateway.
 */
class PaymentVerificationResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $reference,
        public readonly string $status,
        public readonly ?float $amount = null,
        public readonly ?string $currency = null,
        public readonly ?string $gatewayReference = null,
        public readonly ?string $paymentMethod = null,
        public readonly ?string $channel = null,
        public readonly ?string $cardType = null,
        public readonly ?string $cardLast4 = null,
        public readonly ?string $bank = null,
        public readonly ?string $customerEmail = null,
        public readonly ?float $gatewayFee = null,
        public readonly ?string $paidAt = null,
        public readonly ?string $message = null,
        public readonly ?array $rawResponse = null,
    ) {}

    /**
     * Create a successful verification result.
     */
    public static function success(
        string $reference,
        float $amount,
        string $currency,
        string $gatewayReference,
        ?string $paymentMethod = null,
        ?string $channel = null,
        ?float $gatewayFee = null,
        ?string $paidAt = null,
        ?array $rawResponse = null
    ): self {
        return new self(
            success: true,
            reference: $reference,
            status: 'success',
            amount: $amount,
            currency: $currency,
            gatewayReference: $gatewayReference,
            paymentMethod: $paymentMethod,
            channel: $channel,
            gatewayFee: $gatewayFee,
            paidAt: $paidAt,
            rawResponse: $rawResponse,
        );
    }

    /**
     * Create a pending verification result.
     */
    public static function pending(
        string $reference,
        ?string $message = null,
        ?array $rawResponse = null
    ): self {
        return new self(
            success: false,
            reference: $reference,
            status: 'pending',
            message: $message ?? 'Payment is still being processed',
            rawResponse: $rawResponse,
        );
    }

    /**
     * Create a failed verification result.
     */
    public static function failed(
        string $reference,
        string $message,
        ?array $rawResponse = null
    ): self {
        return new self(
            success: false,
            reference: $reference,
            status: 'failed',
            message: $message,
            rawResponse: $rawResponse,
        );
    }

    /**
     * Check if payment is still pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if payment failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if verification was successful.
     */
    public function isSuccessful(): bool
    {
        return $this->success && $this->status === 'success';
    }
}
