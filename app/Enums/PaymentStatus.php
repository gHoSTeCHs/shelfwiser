<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case UNPAID = 'unpaid';
    case PARTIAL = 'partial';
    case PAID = 'paid';
    case REFUNDED = 'refunded';
    case FAILED = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::UNPAID => 'Unpaid',
            self::PARTIAL => 'Partially Paid',
            self::PAID => 'Paid',
            self::REFUNDED => 'Refunded',
            self::FAILED => 'Payment Failed',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::UNPAID => 'No payment received',
            self::PARTIAL => 'Partial payment received',
            self::PAID => 'Payment completed',
            self::REFUNDED => 'Payment refunded to customer',
            self::FAILED => 'Payment attempt failed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::UNPAID => 'error',
            self::PARTIAL => 'warning',
            self::PAID => 'success',
            self::REFUNDED => 'gray',
            self::FAILED => 'error',
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return match ($this) {
            self::UNPAID => in_array($newStatus, [self::PARTIAL, self::PAID, self::FAILED]),
            self::PARTIAL => in_array($newStatus, [self::PAID, self::REFUNDED]),
            self::PAID => in_array($newStatus, [self::REFUNDED]),
            self::REFUNDED => false,
            self::FAILED => in_array($newStatus, [self::UNPAID, self::PAID]),
        };
    }

    public function isComplete(): bool
    {
        return $this === self::PAID;
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($status) => [$status->value => $status->label()])
            ->toArray();
    }
}
