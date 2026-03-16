<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Services\StorefrontService;

class ProductGridSection implements StorefrontSectionInterface
{
    public function __construct(
        private readonly StorefrontService $storefrontService,
    ) {}

    public function type(): string
    {
        return 'product_grid';
    }

    public function label(): string
    {
        return 'Product Grid';
    }

    public function description(): string
    {
        return 'Full product catalog with filtering, search, and sorting';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::PRODUCTS;
    }

    public function icon(): string
    {
        return 'squares-2x2';
    }

    public function variants(): array
    {
        return ['standard_grid', 'sidebar_filters', 'infinite_scroll', 'grid_list_toggle'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Our Products',
                'description' => 'Section heading',
            ],
            'show_search' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show search bar',
            ],
            'show_filters' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show category/price filters',
            ],
            'show_sort' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show sort dropdown',
            ],
            'default_sort' => [
                'type' => 'select',
                'options' => ['newest', 'price_asc', 'price_desc', 'name_asc', 'bestselling'],
                'default' => 'newest',
                'description' => 'Default sort order',
            ],
            'products_per_page' => [
                'type' => 'select',
                'options' => [12, 16, 20, 24, 32],
                'default' => 16,
                'description' => 'Products per page',
            ],
            'columns' => [
                'type' => 'select',
                'options' => [2, 3, 4, 5],
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
        $sortMap = [
            'newest' => 'newest',
            'price_asc' => 'price_low',
            'price_desc' => 'price_high',
            'name_asc' => 'name',
            'bestselling' => 'featured',
        ];

        $sort = $sortMap[$config['default_sort'] ?? 'newest'] ?? 'newest';
        $perPage = $config['products_per_page'] ?? 16;

        $products = $this->storefrontService->getProducts($shop, null, null, $sort, $perPage);

        return [
            'products' => collect($products->items())->toArray(),
            'categories' => $this->storefrontService->getCategories($shop)->toArray(),
        ];
    }

    public function allowedPageTypes(): array
    {
        return [StorefrontPageType::PRODUCTS, StorefrontPageType::CUSTOM];
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
