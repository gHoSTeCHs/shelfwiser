<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Models\Shop;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductService
{
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

                $product = Product::create($productData);

                if ($hasVariants && isset($data['variants'])) {
                    foreach ($data['variants'] as $variantData) {
                        $this->createVariant($product, $variantData);
                    }
                } else {
                    $this->createDefaultVariant($product, $data);
                }

                Cache::tags(["tenant:{$tenant->id}:products"])->flush();

                Log::info('Product created successfully.', ['product_id' => $product->id]);

                return $product->load('type', 'category', 'variants');
            });
        } catch (\Throwable $e) {
            Log::error('Product creation failed.', [
                'tenant_id' => $tenant->id,
                'shop_id' => $shop->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

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

                Cache::tags(["tenant:{$product->tenant_id}:products"])->flush();

                Log::info('Product updated successfully.', ['product_id' => $product->id]);

                return $product->fresh(['type', 'category', 'variants']);
            });
        } catch (\Throwable $e) {
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
        return ProductVariant::create([
            'product_id' => $product->id,
            'sku' => $data['sku'],
            'barcode' => $data['barcode'] ?? null,
            'name' => $data['name'] ?? null,
            'attributes' => $data['attributes'] ?? null,
            'price' => $data['price'],
            'cost_price' => $data['cost_price'] ?? null,
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
        return ProductVariant::create([
            'product_id' => $product->id,
            'sku' => $data['sku'],
            'barcode' => $data['barcode'] ?? null,
            'name' => null,
            'attributes' => null,
            'price' => $data['price'],
            'cost_price' => $data['cost_price'] ?? null,
            'reorder_level' => $data['reorder_level'] ?? 0,
            'is_active' => true,
        ]);
    }

    private function resolveProductType(string $slug, Tenant $tenant): ProductType
    {
        $cacheKey = "tenant:{$tenant->id}:product_type:slug:$slug";

        return Cache::tags(["tenant:{$tenant->id}:product_types"])
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

        for ($counter = 1; Product::where('tenant_id', $tenant->id)->where('slug', $slug)->exists(); $counter++) {
            $slug = "$base-$counter";
        }

        return $slug;
    }
}
