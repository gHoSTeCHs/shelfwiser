<?php

namespace App\Enums;

enum CatalogVisibility: string
{
    case PUBLIC = 'public';
    case PRIVATE = 'private';
    case CONNECTIONS_ONLY = 'connections_only';

    public function label(): string
    {
        return match ($this) {
            self::PUBLIC => 'Public (visible to all)',
            self::PRIVATE => 'Private (not visible)',
            self::CONNECTIONS_ONLY => 'Connections Only',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($visibility) => [$visibility->value => $visibility->label()])
            ->toArray();
    }
}
