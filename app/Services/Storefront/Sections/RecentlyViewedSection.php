<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class RecentlyViewedSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'recently_viewed';
    }

    public function label(): string
    {
        return 'Recently Viewed';
    }

    public function description(): string
    {
        return 'Products recently viewed by the customer';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::PRODUCTS;
    }

    public function icon(): string
    {
        return 'eye';
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
                'default' => 'Recently Viewed',
                'description' => 'Section heading',
            ],
            'max_items' => [
                'type' => 'number',
                'default' => 6,
                'description' => 'Max products to display (4-12)',
            ],
            'columns' => [
                'type' => 'select',
                'options' => [3, 4, 5, 6],
                'default' => 4,
                'description' => 'Grid columns',
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
            StorefrontPageType::PRODUCT_DETAIL,
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
