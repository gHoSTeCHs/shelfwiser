<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPackagingType;
use App\Models\ProductTemplate;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ProductService
{
    public function __construct(
        private readonly VariantMatrixService $variantMatrixService
    ) {}

    /**
     * @throws Throwable
     */
    public function create(array $data, Tenant $tenant, Shop $shop): Product
    {
        Log::info('Product creation process started.', [
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'product_name' => $data['name'] ?? null,
            'product_type' => $data['product_type_slug'] ?? null,
            'has_variants' => $data['has_variants'] ?? false,
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
                    'size_guide' => $data['size_guide'] ?? null,
                    'is_active' => $data['is_active'] ?? true,
                ];

                $product = Product::query()->create($productData);

                if ($hasVariants && isset($data['variants'])) {
                    foreach ($data['variants'] as $variantData) {
                        $variant = $this->createVariant($product, $variantData);
                        $variant->setRelation('product', $product);

                        if (isset($variantData['packaging_types'])) {
                            $this->createPackagingTypes($variant, $variantData['packaging_types']);
                        } else {
                            $this->createDefaultPackagingType($variant, $shop);
                        }
                    }
                } else {
                    $variant = $this->createDefaultVariant($product, $data);
                    $variant->setRelation('product', $product);

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
                'product_name' => $data['name'] ?? null,
                'message' => $e->getMessage(),
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
            'fields' => array_keys($data),
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

                if (array_key_exists('has_variants', $data)) {
                    if (! $product->has_variants && $data['has_variants']) {
                        $this->variantMatrixService->guardToggleHasVariantsTrue($product);
                    } elseif ($product->has_variants && ! $data['has_variants']) {
                        $this->variantMatrixService->guardToggleHasVariantsFalse($product);
                    }
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
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Soft-delete a product. Refuses if any of its variants are attached to
     * non-cancelled order items — preserves order history integrity.
     *
     * @throws Throwable
     */
    public function delete(Product $product): void
    {
        $variantIds = $product->variants()->pluck('id');

        $hasOpenSales = \App\Models\OrderItem::query()
            ->whereIn('product_variant_id', $variantIds)
            ->whereHas('order', fn ($q) => $q->where('status', '!=', 'cancelled'))
            ->exists();

        if ($hasOpenSales) {
            throw new \RuntimeException('Cannot delete a product that has been sold. Archive it instead.');
        }

        DB::transaction(function () use ($product) {
            $product->variants()->delete();
            $product->delete();
        });

        Log::info('Product deleted', ['product_id' => $product->id, 'name' => $product->name]);

        Cache::tags(["tenant:{$product->tenant_id}:products:list"])->flush();
    }

    public function getProductsForIndex(): LengthAwarePaginator
    {
        return Product::query()
            ->with([
                'type:id,slug,label',
                'category:id,name,slug',
                'shop:id,name,slug',
                'variants.inventoryLocations',
                'images' => function ($query) {
                    $query->ordered()->limit(1);
                },
            ])
            ->withCount('variants')
            ->latest()
            ->paginate(20);
    }

    public function getCreateFormData(int $tenantId): array
    {
        return [
            'shops' => Shop::query()
                ->where('is_active', true)
                ->get(['id', 'name', 'slug', 'inventory_model']),
            'productTypes' => $this->getProductTypesForForm($tenantId),
            'categories' => $this->getCategoriesForForm(),
            'templates' => ProductTemplate::availableFor($tenantId)
                ->active()
                ->with(['productType', 'category'])
                ->orderBy('name')
                ->get(),
        ];
    }

    public function getEditFormData(Product $product): array
    {
        $product->load([
            'type',
            'category',
            'variants.packagingTypes',
            'variants.optionValues',
            'options.values',
            'images' => function ($query) {
                $query->ordered();
            },
            'variants.images' => function ($query) {
                $query->ordered();
            },
        ]);

        return [
            'productTypes' => $this->getProductTypesForForm($product->tenant_id),
            'categories' => $this->getCategoriesForForm(),
        ];
    }

    public function getProductShowData(Product $product): array
    {
        $product->load([
            'type',
            'category',
            'shop',
            'variants.inventoryLocations.location',
            'variants.packagingTypes',
            'variants.optionValues',
            'options.values',
            'images' => function ($query) {
                $query->ordered();
            },
            'variants.images' => function ($query) {
                $query->ordered();
            },
        ]);

        $variantIds = $product->variants->pluck('id');

        return [
            'available_shops' => Shop::query()
                ->where('is_active', true)
                ->get(['id', 'name']),
            'recent_movements' => StockMovement::query()
                ->whereIn('product_variant_id', $variantIds)
                ->with(['productVariant', 'fromLocation.location', 'toLocation.location'])
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    private function getProductTypesForForm(int $tenantId): \Illuminate\Support\Collection
    {
        return ProductType::accessibleTo($tenantId)
            ->where('is_active', true)
            ->get(['id', 'slug', 'label', 'description', 'config_schema', 'option_templates', 'supports_variants', 'requires_batch_tracking', 'requires_serial_tracking']);
    }

    private function getCategoriesForForm(): \Illuminate\Support\Collection
    {
        return ProductCategory::query()
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->get(['id', 'name', 'slug']);
    }

    private function createVariant(Product $product, array $data): ProductVariant
    {
        $variant = ProductVariant::query()->create([
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

        if (! empty($data['option_value_ids'])) {
            $variant->optionValues()->attach($data['option_value_ids']);
        }

        return $variant;
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
        $counter = 1;

        while (
            Product::query()
                ->where('tenant_id', $tenant->id)
                ->where('slug', $slug)
                ->lockForUpdate()
                ->exists()
        ) {
            $slug = $base.'-'.$counter;
            $counter++;
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
     * Filter a list of variant IDs to only those the user is authorized to manage.
     * Owners and General Managers get tenant-wide access; all other roles are
     * restricted to variants belonging to their assigned shops.
     *
     * @param  array<int>  $ids
     * @return array<int>
     */
    public function filterVariantsByOwnership(array $ids, User $user): array
    {
        $query = ProductVariant::query()
            ->whereIn('id', $ids)
            ->whereHas('product', fn ($q) => $q->where('tenant_id', $user->tenant_id));

        $tenantWideRoles = [\App\Enums\UserRole::OWNER->value, \App\Enums\UserRole::GENERAL_MANAGER->value];

        if (! in_array($user->role->value, $tenantWideRoles, true)) {
            $accessibleShopIds = $user->shops()->pluck('shops.id');
            $query->whereHas('product', fn ($q) => $q->whereIn('shop_id', $accessibleShopIds));
        }

        return $query->pluck('id')->all();
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
            'fields' => array_keys($data),
        ]);

        try {
            return DB::transaction(function () use ($variant, $data) {
                $variant->update(Arr::only($data, [
                    'sku', 'barcode', 'name', 'attributes', 'price', 'retail_price',
                    'cost_price', 'reorder_level', 'max_order_quantity', 'base_unit_name',
                    'image_url', 'images', 'batch_number', 'expiry_date', 'serial_number',
                    'is_active', 'is_available_online', 'allow_retail_sales',
                ]));

                if (isset($data['option_value_ids'])) {
                    $variant->optionValues()->sync($data['option_value_ids']);
                }

                if (isset($data['price']) && $variant->packagingTypes()->exists()) {
                    $basePackaging = $variant->packagingTypes()
                        ->where('is_base_unit', true)
                        ->first();

                    if ($basePackaging) {
                        $basePackaging->update(['price' => $data['price']]);

                        $safePrice = (float) $data['price'];
                        $variant->packagingTypes()
                            ->where('is_base_unit', false)
                            ->update(['price' => DB::raw("units_per_package * {$safePrice}")]);
                    }
                }

                if (isset($data['cost_price']) && $variant->packagingTypes()->exists()) {
                    $basePackaging = $variant->packagingTypes()
                        ->where('is_base_unit', true)
                        ->first();

                    if ($basePackaging && $data['cost_price'] !== null) {
                        $basePackaging->update(['cost_price' => $data['cost_price']]);

                        $safeCostPrice = (float) $data['cost_price'];
                        $variant->packagingTypes()
                            ->where('is_base_unit', false)
                            ->update(['cost_price' => DB::raw("units_per_package * {$safeCostPrice}")]);
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
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
