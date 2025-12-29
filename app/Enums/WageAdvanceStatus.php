<?php

namespace App\Enums;

enum WageAdvanceStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case DISBURSED = 'disbursed';
    case REPAYING = 'repaying';
    case REPAID = 'repaid';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending Approval',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::DISBURSED => 'Disbursed',
            self::REPAYING => 'Repaying',
            self::REPAID => 'Fully Repaid',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'warning',
            self::APPROVED => 'success',
            self::REJECTED => 'error',
            self::DISBURSED => 'info',
            self::REPAYING => 'warning',
            self::REPAID => 'success',
            self::CANCELLED => 'light',
        };
    }

    public function canApprove(): bool
    {
        return $this === self::PENDING;
    }

    public function canReject(): bool
    {
        return $this === self::PENDING;
    }

    public function canDisburse(): bool
    {
        return $this === self::APPROVED;
    }

    public function canCancel(): bool
    {
        return match ($this) {
            self::PENDING, self::APPROVED => true,
            default => false,
        };
    }

    public function canRecordRepayment(): bool
    {
        return match ($this) {
            self::DISBURSED, self::REPAYING => true,
            default => false,
        };
    }

    public static function options(): array
    {
        return collect(self::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->all();
    }
}
