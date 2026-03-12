<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class GallerySection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'gallery';
    }

    public function label(): string
    {
        return 'Gallery';
    }

    public function description(): string
    {
        return 'Image gallery with lightbox support';
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
        return ['grid', 'masonry', 'carousel', 'fullscreen_slider'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Optional heading',
            ],
            'images' => [
                'type' => 'image_list',
                'default' => [],
                'description' => 'Gallery images',
            ],
            'columns' => [
                'type' => 'select',
                'options' => [2, 3, 4],
                'default' => 3,
                'description' => 'Grid columns',
            ],
            'lightbox' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Click to enlarge',
            ],
            'gap' => [
                'type' => 'select',
                'options' => ['none', 'small', 'medium'],
                'default' => 'small',
                'description' => 'Gap between images',
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
        return 2;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
