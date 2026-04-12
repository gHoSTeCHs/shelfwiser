<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class LogoCloudSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'logo_cloud';
    }

    public function label(): string
    {
        return 'Logo Cloud';
    }

    public function description(): string
    {
        return 'Partner or brand logo showcase';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::SOCIAL_PROOF;
    }

    public function icon(): string
    {
        return 'building-office';
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
                'default' => 'Trusted By',
                'description' => 'Section heading',
            ],
            'logos' => [
                'type' => 'image_list',
                'default' => [],
                'description' => 'Logo images',
            ],
            'display_mode' => [
                'type' => 'select',
                'options' => ['static', 'scrolling_marquee'],
                'default' => 'static',
                'description' => 'Display mode',
            ],
            'grayscale' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show logos in grayscale',
            ],
            'max_height' => [
                'type' => 'number',
                'default' => 48,
                'description' => 'Max logo height in pixels',
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
            StorefrontPageType::ABOUT,
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
