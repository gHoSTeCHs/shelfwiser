<?php

namespace App\Enums;

enum StorefrontThemeCategory: string
{
    case GENERAL = 'general';
    case FASHION = 'fashion';
    case GROCERY = 'grocery';
    case HEALTH = 'health';
    case TECH = 'tech';
    case ARTISAN = 'artisan';

    public function label(): string
    {
        return match ($this) {
            self::GENERAL => 'General',
            self::FASHION => 'Fashion & Luxury',
            self::GROCERY => 'Grocery & Food',
            self::HEALTH => 'Health & Beauty',
            self::TECH => 'Tech & Electronics',
            self::ARTISAN => 'Artisan & Handmade',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
            ->toArray();
    }
}
