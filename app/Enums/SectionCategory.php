<?php

namespace App\Enums;

enum SectionCategory: string
{
    case HERO = 'hero';
    case PRODUCTS = 'products';
    case CONTENT = 'content';
    case SOCIAL_PROOF = 'social_proof';
    case NAVIGATION = 'navigation';
    case COMMERCE = 'commerce';
    case MEDIA = 'media';
    case LAYOUT = 'layout';

    public function label(): string
    {
        return match ($this) {
            self::HERO => 'Hero',
            self::PRODUCTS => 'Products',
            self::CONTENT => 'Content',
            self::SOCIAL_PROOF => 'Social Proof',
            self::NAVIGATION => 'Navigation',
            self::COMMERCE => 'Commerce',
            self::MEDIA => 'Media',
            self::LAYOUT => 'Layout',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
            ->toArray();
    }
}
