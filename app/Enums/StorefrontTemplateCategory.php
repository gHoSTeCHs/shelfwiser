<?php

namespace App\Enums;

enum StorefrontTemplateCategory: string
{
    case COMMERCE = 'commerce';
    case EDITORIAL = 'editorial';
    case MARKETPLACE = 'marketplace';
    case IMMERSIVE = 'immersive';
    case CATALOG = 'catalog';
    case STORYTELLER = 'storyteller';
    case SERVICE = 'service';
    case CONTENT = 'content';
    case CAMPAIGN = 'campaign';
    case SOCIAL = 'social';
    case SPECIALTY = 'specialty';

    public function label(): string
    {
        return match ($this) {
            self::COMMERCE => 'Commerce',
            self::EDITORIAL => 'Editorial',
            self::MARKETPLACE => 'Marketplace',
            self::IMMERSIVE => 'Immersive',
            self::CATALOG => 'Catalog',
            self::STORYTELLER => 'Storyteller',
            self::SERVICE => 'Service',
            self::CONTENT => 'Content',
            self::CAMPAIGN => 'Campaign',
            self::SOCIAL => 'Social',
            self::SPECIALTY => 'Specialty',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
            ->toArray();
    }
}
