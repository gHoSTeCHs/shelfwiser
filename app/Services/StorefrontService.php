<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Shop;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class StorefrontService
{
    public function getFeaturedProducts(Shop $shop, int $limit = 8): Collection
    {
        $cacheKey = $this->getCacheKey($shop->tenant_id, $shop->id, 'featured_products', $limit);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($shop, $limit) {
            $featured = Product::where('tenant_id', $shop->tenant_id)
                ->where('shop_id', $shop->id)
                ->where('is_active', true)
                ->where('is_featured', true)
                ->with(['variants' => fn ($q) => $q->where('is_available_online', true)
                    ->where('is_active', true)
                    ->with('inventoryLocations')])
                ->orderBy('display_order')
                ->orderBy('name')
                ->limit($limit)
                ->get();

            if ($featured->isEmpty()) {
                return Product::where('tenant_id', $shop->tenant_id)
                    ->where('shop_id', $shop->id)
                    ->where('is_active', true)
                    ->with(['variants' => fn ($q) => $q->where('is_available_online', true)
                        ->where('is_active', true)
                        ->with('inventoryLocations')])
                    ->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->get();
            }

            return $featured;
        });
    }

    public function getProducts(
        Shop $shop,
        ?string $search = null,
        ?int $categoryId = null,
        string $sortBy = 'name',
        int $perPage = 12
    ): LengthAwarePaginator {
        $query = Product::where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('is_active', true)
            ->with([
                'variants' => fn ($q) => $q->where('is_available_online', true)
                    ->where('is_active', true)
                    ->with('inventoryLocations'),
                'category',
            ]);

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('seo_keywords', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        // Sorting
        match ($sortBy) {
            'price_low' => $query->join('product_variants', 'products.id', '=', 'product_variants.product_id')
                ->where('product_variants.is_available_online', true)
                ->orderBy('product_variants.price', 'asc')
                ->select('products.*'),
            'price_high' => $query->join('product_variants', 'products.id', '=', 'product_variants.product_id')
                ->where('product_variants.is_available_online', true)
                ->orderBy('product_variants.price', 'desc')
                ->select('products.*'),
            'newest' => $query->orderBy('created_at', 'desc'),
            'featured' => $query->orderBy('is_featured', 'desc')->orderBy('display_order'),
            default => $query->orderBy('name'),
        };

        return $query->paginate($perPage);
    }

    public function getProductBySlug(Shop $shop, string $slug): ?Product
    {
        $cacheKey = $this->getCacheKey($shop->tenant_id, $shop->id, 'product_slug', $slug);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($shop, $slug) {
            return Product::where('tenant_id', $shop->tenant_id)
                ->where('shop_id', $shop->id)
                ->where('slug', $slug)
                ->where('is_active', true)
                ->with([
                    'variants' => fn ($q) => $q->where('is_available_online', true)
                        ->where('is_active', true)
                        ->with('packagingTypes'),
                    'category',
                    'type',
                ])
                ->first();
        });
    }

    public function getRelatedProducts(Product $product, int $limit = 4): Collection
    {
        $cacheKey = $this->getCacheKey($product->tenant_id, $product->shop_id, 'related_products', $product->id, $limit);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($product, $limit) {
            return Product::where('tenant_id', $product->tenant_id)
                ->where('shop_id', $product->shop_id)
                ->where('category_id', $product->category_id)
                ->where('id', '!=', $product->id)
                ->where('is_active', true)
                ->with(['variants' => fn ($q) => $q->where('is_available_online', true)
                    ->where('is_active', true)
                    ->with('inventoryLocations')])
                ->limit($limit)
                ->get();
        });
    }

    public function getCategories(Shop $shop): Collection
    {
        $cacheKey = $this->getCacheKey($shop->tenant_id, $shop->id, 'categories');

        return Cache::remember($cacheKey, now()->addMinutes(60), function () use ($shop) {
            return ProductCategory::where('tenant_id', $shop->tenant_id)
                ->whereNull('parent_id')
                ->withCount(['products' => fn ($q) => $q->where('shop_id', $shop->id)->where('is_active', true)])
                ->orderBy('name')
                ->get();
        });
    }

    public function getProductsByCategory(
        Shop $shop,
        ProductCategory $category,
        string $sortBy = 'name',
        int $perPage = 12
    ): LengthAwarePaginator {
        return $this->getProducts($shop, null, $category->id, $sortBy, $perPage);
    }

    public function getServices(
        Shop $shop,
        ?string $search = null,
        ?int $categoryId = null,
        string $sortBy = 'name',
        int $perPage = 12
    ): LengthAwarePaginator {
        $query = Service::where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('is_active', true)
            ->where('is_available_online', true)
            ->with([
                'variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
                'category',
            ]);

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($categoryId) {
            $query->where('service_category_id', $categoryId);
        }

        // Sorting
        match ($sortBy) {
            'price_low' => $query->join('service_variants', 'services.id', '=', 'service_variants.service_id')
                ->where('service_variants.is_active', true)
                ->orderBy('service_variants.base_price', 'asc')
                ->select('services.*'),
            'price_high' => $query->join('service_variants', 'services.id', '=', 'service_variants.service_id')
                ->where('service_variants.is_active', true)
                ->orderBy('service_variants.base_price', 'desc')
                ->select('services.*'),
            'newest' => $query->orderBy('created_at', 'desc'),
            default => $query->orderBy('name'),
        };

        return $query->paginate($perPage);
    }

    public function getServiceCategories(Shop $shop): Collection
    {
        $cacheKey = $this->getCacheKey($shop->tenant_id, $shop->id, 'service_categories');

        return Cache::remember($cacheKey, now()->addMinutes(60), function () use ($shop) {
            return ServiceCategory::where('tenant_id', $shop->tenant_id)
                ->whereNull('parent_id')
                ->withCount(['services' => fn ($q) => $q->where('shop_id', $shop->id)
                    ->where('is_active', true)
                    ->where('is_available_online', true)])
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
        });
    }

    public function getRelatedServices(Service $service, int $limit = 4): Collection
    {
        $cacheKey = $this->getCacheKey($service->tenant_id, $service->shop_id, 'related_services', $service->id, $limit);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($service, $limit) {
            return Service::where('tenant_id', $service->tenant_id)
                ->where('shop_id', $service->shop_id)
                ->where('service_category_id', $service->service_category_id)
                ->where('id', '!=', $service->id)
                ->where('is_active', true)
                ->where('is_available_online', true)
                ->with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
                ->limit($limit)
                ->get();
        });
    }

    /**
     * Generate tenant-aware cache key for storefront data.
     */
    protected function getCacheKey(int $tenantId, int $shopId, string $type, mixed ...$params): string
    {
        $paramsKey = empty($params) ? '' : ':'.implode(':', $params);

        return "tenant:{$tenantId}:shop:{$shopId}:storefront:{$type}{$paramsKey}";
    }

    /**
     * Invalidate product cache for a shop.
     * Call this when products are created, updated, or deleted.
     */
    public function invalidateProductCache(int $tenantId, int $shopId, ?int $productId = null): void
    {
        Cache::forget($this->getCacheKey($tenantId, $shopId, 'featured_products', 8));
        Cache::forget($this->getCacheKey($tenantId, $shopId, 'categories'));

        if ($productId) {
            $product = Product::find($productId);
            if ($product) {
                Cache::forget($this->getCacheKey($tenantId, $shopId, 'product_slug', $product->slug));
                Cache::forget($this->getCacheKey($tenantId, $shopId, 'related_products', $productId, 4));
            }
        }
    }

    /**
     * Invalidate service cache for a shop.
     * Call this when services are created, updated, or deleted.
     */
    public function invalidateServiceCache(int $tenantId, int $shopId, ?int $serviceId = null): void
    {
        Cache::forget($this->getCacheKey($tenantId, $shopId, 'service_categories'));

        if ($serviceId) {
            Cache::forget($this->getCacheKey($tenantId, $shopId, 'related_services', $serviceId, 4));
        }
    }

    /**
     * Invalidate all storefront caches for a shop.
     */
    public function invalidateAllCache(int $tenantId, int $shopId): void
    {
        $this->invalidateProductCache($tenantId, $shopId);
        $this->invalidateServiceCache($tenantId, $shopId);
    }
}
