<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\ProductCategory;
use App\Models\Shop;
use App\Services\StorefrontService;

class CategoryGridSection implements StorefrontSectionInterface
{
    public function __construct(
        private readonly StorefrontService $storefrontService,
    ) {}

    public function type(): string
    {
        return 'category_grid';
    }

    public function label(): string
    {
        return 'Category Grid';
    }

    public function description(): string
    {
        return 'Browse product categories in a visual grid';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::PRODUCTS;
    }

    public function icon(): string
    {
        return 'tag';
    }

    public function variants(): array
    {
        return ['image_overlay', 'image_above', 'icon_grid', 'carousel', 'chips'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Shop by Category',
                'description' => 'Section heading',
            ],
            'layout' => [
                'type' => 'select',
                'options' => ['grid_2x2', 'grid_3x2', 'grid_3x3'],
                'default' => 'grid_3x2',
                'description' => 'Grid layout',
            ],
            'show_product_count' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show product count per category',
            ],
            'category_source' => [
                'type' => 'select',
                'options' => ['auto', 'manual'],
                'default' => 'auto',
                'description' => 'Category source (auto = top-level)',
            ],
            'manual_category_ids' => [
                'type' => 'category_picker',
                'default' => [],
                'description' => 'Manual category IDs',
            ],
            'max_items' => [
                'type' => 'number',
                'default' => 6,
                'description' => 'Max categories (2-12)',
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
        if (($config['category_source'] ?? 'auto') === 'manual' && ! empty($config['manual_category_ids'])) {
            return ProductCategory::query()
                ->where('tenant_id', $shop->tenant_id)
                ->whereIn('id', $config['manual_category_ids'])
                ->withCount(['products' => fn ($q) => $q->where('shop_id', $shop->id)->where('is_active', true)])
                ->get()
                ->toArray();
        }

        return $this->storefrontService->getCategories($shop)
            ->take($config['max_items'] ?? 6)
            ->toArray();
    }

    public function allowedPageTypes(): array
    {
        return [StorefrontPageType::HOME, StorefrontPageType::PRODUCTS, StorefrontPageType::CUSTOM];
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
