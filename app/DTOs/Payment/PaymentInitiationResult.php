<?php

namespace App\DTOs\Payment;

/**
 * Result of initializing a payment with a gateway.
 *
 * Contains all necessary information to complete the payment flow,
 * whether that's a redirect URL, inline payment data, or crypto address.
 */
class PaymentInitiationResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $reference,
        public readonly ?string $authorizationUrl = null,
        public readonly ?string $accessCode = null,
        public readonly ?array $inlineData = null,
        public readonly ?string $qrCode = null,
        public readonly ?string $walletAddress = null,
        public readonly ?float $cryptoAmount = null,
        public readonly ?string $cryptoCurrency = null,
        public readonly ?int $expiresAt = null,
        public readonly ?string $message = null,
        public readonly ?array $metadata = null,
    ) {}

    /**
     * Create a successful redirect-based payment result.
     */
    public static function redirect(
        string $reference,
        string $authorizationUrl,
        ?string $accessCode = null,
        ?array $metadata = null
    ): self {
        return new self(
            success: true,
            reference: $reference,
            authorizationUrl: $authorizationUrl,
            accessCode: $accessCode,
            metadata: $metadata,
        );
    }

    /**
     * Create a successful inline payment result.
     */
    public static function inline(
        string $reference,
        array $inlineData,
        ?array $metadata = null
    ): self {
        return new self(
            success: true,
            reference: $reference,
            inlineData: $inlineData,
            metadata: $metadata,
        );
    }

    /**
     * Create a successful crypto payment result.
     */
    public static function crypto(
        string $reference,
        string $walletAddress,
        float $cryptoAmount,
        string $cryptoCurrency,
        ?string $qrCode = null,
        ?int $expiresAt = null,
        ?array $metadata = null
    ): self {
        return new self(
            success: true,
            reference: $reference,
            walletAddress: $walletAddress,
            cryptoAmount: $cryptoAmount,
            cryptoCurrency: $cryptoCurrency,
            qrCode: $qrCode,
            expiresAt: $expiresAt,
            metadata: $metadata,
        );
    }

    /**
     * Create a failed payment initiation result.
     */
    public static function failed(string $message, ?string $reference = null): self
    {
        return new self(
            success: false,
            reference: $reference ?? '',
            message: $message,
        );
    }

    /**
     * Check if payment requires redirect to external URL.
     */
    public function requiresRedirect(): bool
    {
        return $this->success && $this->authorizationUrl !== null;
    }

    /**
     * Check if payment can be completed inline.
     */
    public function isInline(): bool
    {
        return $this->success && $this->inlineData !== null;
    }

    /**
     * Check if this is a crypto payment.
     */
    public function isCrypto(): bool
    {
        return $this->success && $this->walletAddress !== null;
    }
}
