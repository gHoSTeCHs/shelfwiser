<?php

namespace App\Enums;

enum PayRunStatus: string
{
    case DRAFT = 'draft';
    case CALCULATING = 'calculating';
    case PENDING_REVIEW = 'pending_review';
    case PENDING_APPROVAL = 'pending_approval';
    case APPROVED = 'approved';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::CALCULATING => 'Calculating',
            self::PENDING_REVIEW => 'Pending Review',
            self::PENDING_APPROVAL => 'Pending Approval',
            self::APPROVED => 'Approved',
            self::PROCESSING => 'Processing',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'gray',
            self::CALCULATING => 'blue',
            self::PENDING_REVIEW => 'amber',
            self::PENDING_APPROVAL => 'orange',
            self::APPROVED => 'green',
            self::PROCESSING => 'indigo',
            self::COMPLETED => 'emerald',
            self::CANCELLED => 'red',
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
