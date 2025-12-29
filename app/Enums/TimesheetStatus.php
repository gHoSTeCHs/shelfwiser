<?php

namespace App\Enums;

enum TimesheetStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case PAID = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::SUBMITTED => 'Submitted',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::PAID => 'Paid',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'light',
            self::SUBMITTED => 'warning',
            self::APPROVED => 'success',
            self::REJECTED => 'error',
            self::PAID => 'info',
        };
    }

    public function canEdit(): bool
    {
        return match ($this) {
            self::DRAFT => true,
            default => false,
        };
    }

    public function canSubmit(): bool
    {
        return match ($this) {
            self::DRAFT => true,
            default => false,
        };
    }

    public function canApprove(): bool
    {
        return match ($this) {
            self::SUBMITTED => true,
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
