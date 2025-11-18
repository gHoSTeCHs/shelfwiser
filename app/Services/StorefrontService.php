<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Shop;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class StorefrontService
{
    /**
     * Get featured products for the shop.
     */
    public function getFeaturedProducts(Shop $shop, int $limit = 8): Collection
    {
        return Product::where('shop_id', $shop->id)
            ->where('is_active', true)
            ->where('is_featured', true)
            ->with(['variants' => fn ($q) => $q->where('is_available_online', true)->where('is_active', true)])
            ->orderBy('display_order')
            ->orderBy('name')
            ->limit($limit)
            ->get();
    }

    /**
     * Get products with filters, search, and sorting.
     */
    public function getProducts(
        Shop $shop,
        ?string $search = null,
        ?int $categoryId = null,
        string $sortBy = 'name',
        int $perPage = 12
    ): LengthAwarePaginator {
        $query = Product::where('shop_id', $shop->id)
            ->where('is_active', true)
            ->with([
                'variants' => fn ($q) => $q->where('is_available_online', true)->where('is_active', true),
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

    /**
     * Get product by slug with full details.
     */
    public function getProductBySlug(Shop $shop, string $slug): ?Product
    {
        return Product::where('shop_id', $shop->id)
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
    }

    /**
     * Get related products (same category).
     */
    public function getRelatedProducts(Product $product, int $limit = 4): Collection
    {
        return Product::where('shop_id', $product->shop_id)
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->with(['variants' => fn ($q) => $q->where('is_available_online', true)->where('is_active', true)])
            ->limit($limit)
            ->get();
    }

    /**
     * Get categories for the shop.
     */
    public function getCategories(Shop $shop): Collection
    {
        return ProductCategory::where('tenant_id', $shop->tenant_id)
            ->whereNull('parent_id')
            ->withCount(['products' => fn ($q) => $q->where('shop_id', $shop->id)->where('is_active', true)])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get products by category.
     */
    public function getProductsByCategory(
        Shop $shop,
        ProductCategory $category,
        string $sortBy = 'name',
        int $perPage = 12
    ): LengthAwarePaginator {
        return $this->getProducts($shop, null, $category->id, $sortBy, $perPage);
    }

    /**
     * Get services with filters, search, and sorting.
     */
    public function getServices(
        Shop $shop,
        ?string $search = null,
        ?int $categoryId = null,
        string $sortBy = 'name',
        int $perPage = 12
    ): LengthAwarePaginator {
        $query = Service::where('shop_id', $shop->id)
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

    /**
     * Get service categories for the shop.
     */
    public function getServiceCategories(Shop $shop): Collection
    {
        return ServiceCategory::where('tenant_id', $shop->tenant_id)
            ->whereNull('parent_id')
            ->withCount(['services' => fn ($q) => $q->where('shop_id', $shop->id)
                ->where('is_active', true)
                ->where('is_available_online', true)])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get related services (same category).
     */
    public function getRelatedServices(Service $service, int $limit = 4): Collection
    {
        return Service::where('shop_id', $service->shop_id)
            ->where('service_category_id', $service->service_category_id)
            ->where('id', '!=', $service->id)
            ->where('is_active', true)
            ->where('is_available_online', true)
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->limit($limit)
            ->get();
    }
}
