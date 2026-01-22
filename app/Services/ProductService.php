<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductPackagingType;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ProductService
{
    /**
     * @throws Throwable
     */
    public function create(array $data, Tenant $tenant, Shop $shop): Product
    {
        Log::info('Product creation process started.', [
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'data' => $data,
        ]);

        try {
            return DB::transaction(function () use ($data, $tenant, $shop) {
                $productType = $this->resolveProductType($data['product_type_slug'], $tenant);

                $handler = ProductConfigHandlerFactory::make($productType);
                $customAttributes = isset($data['custom_attributes'])
                    ? array_merge($handler->getDefaults(), $data['custom_attributes'])
                    : $handler->getDefaults();

                $slug = $this->generateUniqueSlug($data['name'], $tenant);

                $hasVariants = $data['has_variants'] ?? false;

                $productData = [
                    'tenant_id' => $tenant->id,
                    'shop_id' => $shop->id,
                    'product_type_id' => $productType->id,
                    'category_id' => $data['category_id'] ?? null,
                    'name' => $data['name'],
                    'slug' => $slug,
                    'description' => $data['description'] ?? null,
                    'custom_attributes' => $customAttributes,
                    'has_variants' => $hasVariants,
                    'is_active' => $data['is_active'] ?? true,
                ];

                $product = Product::query()->create($productData);

                if ($hasVariants && isset($data['variants'])) {
                    foreach ($data['variants'] as $variantData) {
                        $variant = $this->createVariant($product, $variantData);

                        // Create packaging types for this variant
                        if (isset($variantData['packaging_types'])) {
                            $this->createPackagingTypes($variant, $variantData['packaging_types']);
                        } else {
                            $this->createDefaultPackagingType($variant, $shop);
                        }
                    }
                } else {
                    $variant = $this->createDefaultVariant($product, $data);

                    // Create packaging types for simple products
                    if (isset($data['packaging_types'])) {
                        $this->createPackagingTypes($variant, $data['packaging_types']);
                    } else {
                        $this->createDefaultPackagingType($variant, $shop);
                    }
                }

                // Invalidate only list cache, not individual product caches
                Cache::tags(["tenant:$tenant->id:products:list"])->flush();

                Log::info('Product created successfully.', ['product_id' => $product->id]);

                return $product->load('type', 'category', 'variants.packagingTypes');
            });
        } catch (Throwable $e) {
            Log::error('Product creation failed.', [
                'tenant_id' => $tenant->id,
                'shop_id' => $shop->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function update(Product $product, array $data): Product
    {
        Log::info('Product update process started.', [
            'product_id' => $product->id,
            'data' => $data,
        ]);

        try {
            return DB::transaction(function () use ($product, $data) {
                if (isset($data['custom_attributes']) && isset($data['product_type_slug'])) {
                    $productType = $this->resolveProductType(
                        $data['product_type_slug'],
                        $product->tenant
                    );
                    $handler = ProductConfigHandlerFactory::make($productType);
                    $data['custom_attributes'] = array_merge(
                        $handler->getDefaults(),
                        $data['custom_attributes']
                    );
                }

                $product->update($data);

                // Invalidate specific product cache and list cache
                Cache::tags([
                    "tenant:$product->tenant_id:products:list",
                    "tenant:$product->tenant_id:product:$product->id",
                ])->flush();

                Log::info('Product updated successfully.', ['product_id' => $product->id]);

                return $product->fresh(['type', 'category', 'variants.packagingTypes']);
            });
        } catch (Throwable $e) {
            Log::error('Product update failed.', [
                'product_id' => $product->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    private function createVariant(Product $product, array $data): ProductVariant
    {
        return ProductVariant::query()->create([
            'product_id' => $product->id,
            'sku' => $data['sku'],
            'barcode' => $data['barcode'] ?? null,
            'name' => $data['name'] ?? null,
            'attributes' => $data['attributes'] ?? null,
            'price' => $data['price'],
            'cost_price' => $data['cost_price'] ?? null,
            'base_unit_name' => $data['base_unit_name'] ?? 'Unit',
            'reorder_level' => $data['reorder_level'] ?? 0,
            'image_url' => $data['image_url'] ?? null,
            'images' => $data['images'] ?? null,
            'batch_number' => $data['batch_number'] ?? null,
            'expiry_date' => $data['expiry_date'] ?? null,
            'serial_number' => $data['serial_number'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    private function createDefaultVariant(Product $product, array $data): ProductVariant
    {
        return ProductVariant::query()->create([
            'product_id' => $product->id,
            'sku' => $data['sku'],
            'barcode' => $data['barcode'] ?? null,
            'name' => null,
            'attributes' => null,
            'price' => $data['price'],
            'cost_price' => $data['cost_price'] ?? null,
            'base_unit_name' => $data['base_unit_name'] ?? 'Unit',
            'reorder_level' => $data['reorder_level'] ?? 0,
            'is_active' => true,
        ]);
    }

    private function resolveProductType(string $slug, Tenant $tenant): ProductType
    {
        $cacheKey = "tenant:$tenant->id:product_type:slug:$slug";

        return Cache::tags(["tenant:$tenant->id:product_types"])
            ->remember($cacheKey, 3600, function () use ($slug, $tenant) {
                return ProductType::accessibleTo($tenant->id)
                    ->where('slug', $slug)
                    ->firstOrFail();
            });
    }

    private function generateUniqueSlug(string $name, Tenant $tenant): string
    {
        $base = Str::slug($name);
        $slug = $base;

        for ($counter = 1; Product::query()->where('tenant_id', $tenant->id)->where('slug', $slug)->exists(); $counter++) {
            $slug = "$base-$counter";
        }

        return $slug;
    }

    private function createDefaultPackagingType(ProductVariant $variant, Shop $shop): ProductPackagingType
    {
        return ProductPackagingType::query()->create([
            'tenant_id' => $variant->product->tenant_id,
            'product_variant_id' => $variant->id,
            'name' => 'Loose',
            'display_name' => $variant->base_unit_name,
            'units_per_package' => 1,
            'is_sealed_package' => false,
            'price' => $variant->price,
            'cost_price' => $variant->cost_price,
            'is_base_unit' => true,
            'can_break_down' => false,
            'breaks_into_packaging_type_id' => null,
            'min_order_quantity' => 1,
            'display_order' => 0,
            'is_active' => true,
        ]);
    }

    private function createPackagingTypes(ProductVariant $variant, array $packagingTypesData): void
    {
        foreach ($packagingTypesData as $index => $packagingData) {
            ProductPackagingType::query()->create([
                'tenant_id' => $variant->product->tenant_id,
                'product_variant_id' => $variant->id,
                'name' => $packagingData['name'],
                'display_name' => $packagingData['display_name'] ?? $packagingData['name'],
                'units_per_package' => $packagingData['units_per_package'] ?? 1,
                'is_sealed_package' => $packagingData['is_sealed_package'] ?? false,
                'price' => $packagingData['price'],
                'cost_price' => $packagingData['cost_price'] ?? null,
                'is_base_unit' => $packagingData['is_base_unit'] ?? false,
                'can_break_down' => $packagingData['can_break_down'] ?? false,
                'breaks_into_packaging_type_id' => $packagingData['breaks_into_packaging_type_id'] ?? null,
                'min_order_quantity' => $packagingData['min_order_quantity'] ?? 1,
                'display_order' => $packagingData['display_order'] ?? $index,
                'is_active' => $packagingData['is_active'] ?? true,
            ]);
        }
    }

    /**
     * Update a product variant
     *
     * @throws Throwable
     */
    public function updateVariant(ProductVariant $variant, array $data): ProductVariant
    {
        Log::info('Product variant update process started.', [
            'variant_id' => $variant->id,
            'product_id' => $variant->product_id,
            'data' => $data,
        ]);

        try {
            return DB::transaction(function () use ($variant, $data) {
                $variant->update($data);

                // If price changed, update packaging types prices proportionally
                if (isset($data['price']) && $variant->packagingTypes()->exists()) {
                    $basePackaging = $variant->packagingTypes()
                        ->where('is_base_unit', true)
                        ->first();

                    if ($basePackaging) {
                        $basePackaging->update(['price' => $data['price']]);

                        // Update other packaging types based on units_per_package
                        $otherPackaging = $variant->packagingTypes()
                            ->where('is_base_unit', false)
                            ->get();

                        foreach ($otherPackaging as $packaging) {
                            $packaging->update([
                                'price' => $data['price'] * $packaging->units_per_package,
                            ]);
                        }
                    }
                }

                // If cost_price changed, update packaging types cost prices proportionally
                if (isset($data['cost_price']) && $variant->packagingTypes()->exists()) {
                    $basePackaging = $variant->packagingTypes()
                        ->where('is_base_unit', true)
                        ->first();

                    if ($basePackaging && $data['cost_price'] !== null) {
                        $basePackaging->update(['cost_price' => $data['cost_price']]);

                        // Update other packaging types based on units_per_package
                        $otherPackaging = $variant->packagingTypes()
                            ->where('is_base_unit', false)
                            ->get();

                        foreach ($otherPackaging as $packaging) {
                            $packaging->update([
                                'cost_price' => $data['cost_price'] * $packaging->units_per_package,
                            ]);
                        }
                    }
                }

                $product = $variant->product;

                // Invalidate caches
                Cache::tags([
                    "tenant:{$product->tenant_id}:products:list",
                    "tenant:{$product->tenant_id}:product:{$product->id}",
                ])->flush();

                Log::info('Product variant updated successfully.', [
                    'variant_id' => $variant->id,
                    'product_id' => $variant->product_id,
                ]);

                return $variant->fresh(['product', 'packagingTypes']);
            });
        } catch (Throwable $e) {
            Log::error('Product variant update failed.', [
                'variant_id' => $variant->id,
                'product_id' => $variant->product_id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }
}
