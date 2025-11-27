<?php

namespace App\Enums;

enum ConnectionApprovalMode: string
{
    case AUTO = 'auto';
    case OWNER = 'owner';
    case GENERAL_MANAGER = 'general_manager';
    case ASSISTANT_MANAGER = 'assistant_manager';

    public function requiredRole(): ?UserRole
    {
        return match ($this) {
            self::AUTO => null,
            self::OWNER => UserRole::OWNER,
            self::GENERAL_MANAGER => UserRole::GENERAL_MANAGER,
            self::ASSISTANT_MANAGER => UserRole::ASSISTANT_MANAGER,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::AUTO => 'Auto-approve all connections',
            self::OWNER => 'Require Owner approval',
            self::GENERAL_MANAGER => 'Require General Manager approval',
            self::ASSISTANT_MANAGER => 'Require Assistant Manager approval',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($mode) => [$mode->value => $mode->label()])
            ->toArray();
    }
}
