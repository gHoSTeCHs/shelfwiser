<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class CountdownSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'countdown';
    }

    public function label(): string
    {
        return 'Countdown';
    }

    public function description(): string
    {
        return 'Countdown timer for sales and promotions';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::COMMERCE;
    }

    public function icon(): string
    {
        return 'clock';
    }

    public function variants(): array
    {
        return [];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Sale Ends In',
                'description' => 'Section heading',
            ],
            'target_date' => [
                'type' => 'datetime',
                'default' => null,
                'description' => 'Countdown target date',
            ],
            'expired_message' => [
                'type' => 'text',
                'default' => 'This offer has ended',
                'description' => 'Post-expiry message',
            ],
            'background_color' => [
                'type' => 'color_preset',
                'default' => null,
                'description' => 'Background color',
            ],
            'text_color' => [
                'type' => 'color_preset',
                'default' => '#ffffff',
                'description' => 'Text color',
            ],
            'cta_text' => [
                'type' => 'text',
                'default' => 'Shop Now',
                'description' => 'Button text',
            ],
            'cta_link' => [
                'type' => 'text',
                'default' => '/products',
                'description' => 'Button link',
            ],
            'style' => [
                'type' => 'select',
                'options' => ['flip_clock', 'digital', 'minimal'],
                'default' => 'digital',
                'description' => 'Counter display style',
            ],
        ];
    }

    public function defaultConfig(): array
    {
        return array_map(
            fn (array $field) => $field['default'],
            $this->configSchema(),
        );
    }

    public function resolveData(array $config, Shop $shop): array
    {
        return [];
    }

    public function allowedPageTypes(): array
    {
        return [
            StorefrontPageType::HOME,
            StorefrontPageType::PRODUCTS,
            StorefrontPageType::CUSTOM,
        ];
    }

    public function maxPerPage(): int
    {
        return 1;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
