<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Product;
use App\Models\Shop;
use App\Services\StorefrontService;

class FeaturedProductsSection implements StorefrontSectionInterface
{
    public function __construct(
        private readonly StorefrontService $storefrontService,
    ) {}

    public function type(): string
    {
        return 'featured_products';
    }

    public function label(): string
    {
        return 'Featured Products';
    }

    public function description(): string
    {
        return 'Showcase featured, newest, or curated products';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::PRODUCTS;
    }

    public function icon(): string
    {
        return 'star';
    }

    public function variants(): array
    {
        return ['standard_grid', 'spotlight_plus_grid', 'horizontal_scroll', 'masonry', 'carousel'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Featured Products',
                'description' => 'Section heading',
            ],
            'subheading' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Optional subheading',
            ],
            'product_source' => [
                'type' => 'select',
                'options' => ['featured', 'newest', 'bestselling', 'on_sale', 'manual'],
                'default' => 'featured',
                'description' => 'Product source',
            ],
            'manual_product_ids' => [
                'type' => 'product_picker',
                'default' => [],
                'description' => 'Manual product IDs',
            ],
            'max_items' => [
                'type' => 'number',
                'default' => 8,
                'description' => 'Max products (2-24)',
            ],
            'columns' => [
                'type' => 'select',
                'options' => [2, 3, 4, 5],
                'default' => 4,
                'description' => 'Grid columns',
            ],
            'show_price' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show price',
            ],
            'show_original_price' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show strikethrough for sales',
            ],
            'show_add_to_cart' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Quick add-to-cart button',
            ],
            'show_rating' => [
                'type' => 'toggle',
                'default' => false,
                'description' => 'Show product rating',
            ],
            'view_all_link' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show View All link',
            ],
            'view_all_text' => [
                'type' => 'text',
                'default' => 'View All Products',
                'description' => 'View All link text',
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
        $limit = $config['max_items'] ?? 8;

        return match ($config['product_source'] ?? 'featured') {
            'featured' => $this->storefrontService->getFeaturedProducts($shop, $limit)->toArray(),
            'newest' => Product::query()
                ->where('tenant_id', $shop->tenant_id)
                ->where('shop_id', $shop->id)
                ->where('is_active', true)
                ->with(['variants' => fn ($q) => $q->where('is_active', true)->where('is_available_online', true)])
                ->latest()
                ->limit($limit)
                ->get()
                ->toArray(),
            'manual' => Product::query()
                ->where('tenant_id', $shop->tenant_id)
                ->where('shop_id', $shop->id)
                ->whereIn('id', $config['manual_product_ids'] ?? [])
                ->where('is_active', true)
                ->with(['variants' => fn ($q) => $q->where('is_active', true)->where('is_available_online', true)])
                ->get()
                ->toArray(),
            default => $this->storefrontService->getFeaturedProducts($shop, $limit)->toArray(),
        };
    }

    public function allowedPageTypes(): array
    {
        return [StorefrontPageType::HOME, StorefrontPageType::CUSTOM];
    }

    public function maxPerPage(): int
    {
        return 3;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
