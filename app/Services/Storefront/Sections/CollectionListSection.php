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
            return ['collections' => []];
        }

        $categoryIds = array_filter(array_column($collections, 'category_id'));
        $totalLimit = array_sum(array_column($collections, 'max_items') ?: [8]);

        $categories = ! empty($categoryIds)
            ? \App\Models\ProductCategory::query()
                ->whereIn('id', $categoryIds)
                ->withCount(['products' => fn ($q) => $q
                    ->where('tenant_id', $shop->tenant_id)
                    ->where('shop_id', $shop->id)
                    ->where('is_active', true),
                ])
                ->get()
                ->keyBy('id')
            : collect();

        $products = Product::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('is_active', true)
            ->when(! empty($categoryIds), fn ($q) => $q->whereIn('category_id', $categoryIds))
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->where('is_available_online', true), 'category', 'images'])
            ->limit($totalLimit)
            ->get();

        $result = [];

        foreach ($collections as $collection) {
            $categoryId = $collection['category_id'] ?? null;
            $filtered = $products;

            if ($categoryId) {
                $filtered = $products->where('category_id', $categoryId);
            }

            $category = $categoryId ? $categories->get($categoryId) : null;

            $result[] = [
                'id' => $categoryId ?? 0,
                'name' => $category?->name ?? ($collection['title'] ?? ''),
                'slug' => $category?->slug ?? '',
                'image' => $category?->image ?? null,
                'product_count' => $category?->products_count ?? $filtered->count(),
                'description' => $category?->description ?? null,
                'products' => $filtered->take($collection['max_items'] ?? 8)->values()->map(fn ($product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'price' => (float) ($product->variants->first()?->price ?? 0),
                    'compare_at_price' => $product->variants->first()?->compare_at_price ? (float) $product->variants->first()->compare_at_price : null,
                    'image' => $product->primary_image_url ?? null,
                    'category_name' => $product->category?->name,
                ])->all(),
            ];
        }

        return ['collections' => $result];
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
