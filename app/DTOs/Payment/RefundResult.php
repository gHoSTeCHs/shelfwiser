<?php

namespace App\DTOs\Payment;

/**
 * Result of processing a refund through a gateway.
 */
class RefundResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $reference,
        public readonly string $status,
        public readonly ?float $amount = null,
        public readonly ?string $currency = null,
        public readonly ?string $refundReference = null,
        public readonly ?string $message = null,
        public readonly ?array $rawResponse = null,
    ) {}

    /**
     * Create a successful refund result.
     */
    public static function success(
        string $reference,
        float $amount,
        string $currency,
        string $refundReference,
        ?array $rawResponse = null
    ): self {
        return new self(
            success: true,
            reference: $reference,
            status: 'success',
            amount: $amount,
            currency: $currency,
            refundReference: $refundReference,
            rawResponse: $rawResponse,
        );
    }

    /**
     * Create a pending refund result.
     */
    public static function pending(
        string $reference,
        ?string $refundReference = null,
        ?string $message = null,
        ?array $rawResponse = null
    ): self {
        return new self(
            success: false,
            reference: $reference,
            status: 'pending',
            refundReference: $refundReference,
            message: $message ?? 'Refund is being processed',
            rawResponse: $rawResponse,
        );
    }

    /**
     * Create a failed refund result.
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
}
