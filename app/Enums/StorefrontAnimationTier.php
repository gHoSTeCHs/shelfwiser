<?php

namespace App\Enums;

enum StorefrontAnimationTier: string
{
    case NONE = 'none';
    case SUBTLE = 'subtle';
    case POLISHED = 'polished';
    case CINEMATIC = 'cinematic';

    public function label(): string
    {
        return match ($this) {
            self::NONE => 'None',
            self::SUBTLE => 'Subtle',
            self::POLISHED => 'Polished',
            self::CINEMATIC => 'Cinematic',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
            ->toArray();
    }
}
