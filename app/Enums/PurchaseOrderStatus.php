<?php

namespace App\Enums;

enum PurchaseOrderStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case APPROVED = 'approved';
    case PROCESSING = 'processing';
    case SHIPPED = 'shipped';
    case RECEIVED = 'received';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function canEdit(): bool
    {
        return in_array($this, [self::DRAFT, self::SUBMITTED]);
    }

    public function canCancel(): bool
    {
        return ! in_array($this, [self::SHIPPED, self::RECEIVED, self::COMPLETED, self::CANCELLED]);
    }

    public function canApprove(): bool
    {
        return $this === self::SUBMITTED;
    }

    public function canShip(): bool
    {
        return in_array($this, [self::APPROVED, self::PROCESSING]);
    }

    public function canReceive(): bool
    {
        return $this === self::SHIPPED;
    }

    public function label(): string
    {
        return match($this) {
            self::DRAFT => 'Draft',
            self::SUBMITTED => 'Submitted',
            self::APPROVED => 'Approved',
            self::PROCESSING => 'Processing',
            self::SHIPPED => 'Shipped',
            self::RECEIVED => 'Received',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::DRAFT => 'gray',
            self::SUBMITTED => 'yellow',
            self::APPROVED => 'blue',
            self::PROCESSING => 'indigo',
            self::SHIPPED => 'purple',
            self::RECEIVED => 'green',
            self::COMPLETED => 'emerald',
            self::CANCELLED => 'red',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($status) => [$status->value => $status->label()])
            ->toArray();
    }
}
