<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class BannerSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'banner';
    }

    public function label(): string
    {
        return 'Banner';
    }

    public function description(): string
    {
        return 'Flexible banner image block with optional link';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::MEDIA;
    }

    public function icon(): string
    {
        return 'photo';
    }

    public function variants(): array
    {
        return [];
    }

    public function configSchema(): array
    {
        return [
            'image' => [
                'type' => 'image_upload',
                'default' => null,
                'description' => 'Banner image',
            ],
            'mobile_image' => [
                'type' => 'image_upload',
                'default' => null,
                'description' => 'Mobile-specific image',
            ],
            'alt_text' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Accessibility text',
            ],
            'link_url' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Click-through URL',
            ],
            'height' => [
                'type' => 'select',
                'options' => ['small', 'medium', 'large', 'auto'],
                'default' => 'auto',
                'description' => 'Banner height',
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
        return StorefrontPageType::cases();
    }

    public function maxPerPage(): int
    {
        return 0;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
