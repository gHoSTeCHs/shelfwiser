<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Product;
use App\Models\Shop;

class CollectionListSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'collection_list';
    }

    public function label(): string
    {
        return 'Collection List';
    }

    public function description(): string
    {
        return 'Curated product collections in tabs, rows, or accordions';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::PRODUCTS;
    }

    public function icon(): string
    {
        return 'rectangle-stack';
    }

    public function variants(): array
    {
        return ['tabs', 'rows', 'accordion'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Our Collections',
                'description' => 'Section heading',
            ],
            'collections' => [
                'type' => 'collection_list',
                'default' => [],
                'description' => 'Collections (title, product_source, category_id, max_items)',
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
        $collections = $config['collections'] ?? [];

        if (empty($collections)) {
            return [];
        }

        $categoryIds = array_filter(array_column($collections, 'category_id'));
        $maxLimit = max(array_column($collections, 'max_items') ?: [8]);

        $products = Product::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('is_active', true)
            ->when(! empty($categoryIds), fn ($q) => $q->whereIn('category_id', $categoryIds))
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->where('is_available_online', true)])
            ->get();

        $result = [];

        foreach ($collections as $collection) {
            $filtered = $products;

            if (! empty($collection['category_id'])) {
                $filtered = $products->where('category_id', $collection['category_id']);
            }

            $result[] = [
                'title' => $collection['title'] ?? '',
                'products' => $filtered->take($collection['max_items'] ?? 8)->values()->toArray(),
            ];
        }

        return $result;
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
