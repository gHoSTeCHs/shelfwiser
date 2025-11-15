<?php

namespace App\Enums;

enum ConnectionStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case REJECTED = 'rejected';

    public function canOrder(): bool
    {
        return in_array($this, [self::APPROVED, self::ACTIVE]);
    }

    public function canApprove(): bool
    {
        return $this === self::PENDING;
    }

    public function canSuspend(): bool
    {
        return in_array($this, [self::APPROVED, self::ACTIVE]);
    }

    public function canActivate(): bool
    {
        return in_array($this, [self::APPROVED, self::SUSPENDED]);
    }

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Pending Approval',
            self::APPROVED => 'Approved',
            self::ACTIVE => 'Active',
            self::SUSPENDED => 'Suspended',
            self::REJECTED => 'Rejected',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'yellow',
            self::APPROVED => 'blue',
            self::ACTIVE => 'green',
            self::SUSPENDED => 'orange',
            self::REJECTED => 'red',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($status) => [$status->value => $status->label()])
            ->toArray();
    }
}
