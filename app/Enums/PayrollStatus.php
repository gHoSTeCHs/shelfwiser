<?php

namespace App\Enums;

enum PayrollStatus: string
{
    case DRAFT = 'draft';
    case PROCESSING = 'processing';
    case PROCESSED = 'processed';
    case APPROVED = 'approved';
    case PAID = 'paid';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::PROCESSING => 'Processing',
            self::PROCESSED => 'Processed',
            self::APPROVED => 'Approved',
            self::PAID => 'Paid',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'light',
            self::PROCESSING => 'warning',
            self::PROCESSED => 'info',
            self::APPROVED => 'success',
            self::PAID => 'success',
            self::CANCELLED => 'error',
        };
    }

    public function canProcess(): bool
    {
        return $this === self::DRAFT;
    }

    public function canApprove(): bool
    {
        return $this === self::PROCESSED;
    }

    public function canPay(): bool
    {
        return $this === self::APPROVED;
    }

    public function canCancel(): bool
    {
        return match ($this) {
            self::DRAFT, self::PROCESSING, self::PROCESSED => true,
            default => false,
        };
    }
}
