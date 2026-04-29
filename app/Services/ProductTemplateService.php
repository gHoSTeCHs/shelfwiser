<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPackagingType;
use App\Models\ProductTemplate;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductTemplateService
{
    /**
     * Get paginated templates available for a tenant.
     */
    public function getAvailableTemplates(?int $tenantId, array $filters = []): LengthAwarePaginator
    {
        $query = ProductTemplate::with(['productType', 'category', 'createdBy'])
            ->availableFor($tenantId)
            ->active();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['product_type_id'])) {
            $query->where('product_type_id', $filters['product_type_id']);
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['is_system'])) {
            $query->where('is_system', $filters['is_system']);
        }

        $allowedTemplateSorts = ['name', 'created_at', 'updated_at'];
        $sortField = in_array($filters['sort'] ?? 'name', $allowedTemplateSorts) ? ($filters['sort'] ?? 'name') : 'name';
        $sortDir = in_array($filters['direction'] ?? 'asc', ['asc', 'desc']) ? $filters['direction'] : 'asc';
        $query->orderBy($sortField, $sortDir);

        return $query->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Get a lightweight, non-paginated list of templates for the tenant selection UI.
     */
    public function getAvailableForSelection(int $tenantId, ?string $search, ?int $productTypeId): Collection
    {
        return ProductTemplate::with(['productType', 'category'])
            ->availableFor($tenantId)
            ->active()
            ->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($productTypeId, fn ($q, $id) => $q->where('product_type_id', $id))
            ->orderBy('name')
            ->limit(50)
            ->get();
    }

    /**
     * Get all system templates.
     */
    public function getSystemTemplates(): Collection
    {
        return Cache::remember('product_templates:system', 3600, function () {
            return ProductTemplate::with(['productType', 'category'])
                ->system()
                ->active()
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Get a template by ID.
     */
    public function getTemplate(int $id): ?ProductTemplate
    {
        return ProductTemplate::with(['productType', 'category', 'createdBy'])->find($id);
    }

    /**
     * Create a new product template.
     */
    public function create(array $data, ?Tenant $tenant = null, ?User $actor = null): ProductTemplate
    {
        return DB::transaction(function () use ($data, $tenant, $actor) {
            $template = ProductTemplate::query()->create([
                'tenant_id' => $tenant?->id,
                'product_type_id' => $data['product_type_id'],
                'category_id' => $data['category_id'] ?? null,
                'created_by_id' => $actor?->id,
                'name' => $data['name'],
                'slug' => $this->generateUniqueTemplateSlug($data['name'], $tenant?->id),
                'description' => $data['description'] ?? null,
                'custom_attributes' => $data['custom_attributes'] ?? [],
                'template_structure' => $data['template_structure'],
                'images' => $data['images'] ?? [],
                'seo_metadata' => $data['seo_metadata'] ?? [],
                'has_variants' => $data['has_variants'] ?? false,
                'is_system' => $data['is_system'] ?? false,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearCache($tenant?->id);

            return $template;
        });
    }

    /**
     * Update an existing template.
     */
    public function update(ProductTemplate $template, array $data): ProductTemplate
    {
        return DB::transaction(function () use ($template, $data) {
            $template->update([
                'product_type_id' => $data['product_type_id'] ?? $template->product_type_id,
                'category_id' => $data['category_id'] ?? $template->category_id,
                'name' => $data['name'] ?? $template->name,
                'slug' => isset($data['name']) ? $this->generateUniqueTemplateSlug($data['name'], $template->tenant_id, $template->id) : $template->slug,
                'description' => $data['description'] ?? $template->description,
                'custom_attributes' => $data['custom_attributes'] ?? $template->custom_attributes,
                'template_structure' => $data['template_structure'] ?? $template->template_structure,
                'images' => $data['images'] ?? $template->images,
                'seo_metadata' => $data['seo_metadata'] ?? $template->seo_metadata,
                'has_variants' => $data['has_variants'] ?? $template->has_variants,
                'is_active' => $data['is_active'] ?? $template->is_active,
            ]);

            $this->clearCache($template->tenant_id);

            return $template->fresh();
        });
    }

    /**
     * Delete a template.
     */
    public function delete(ProductTemplate $template): bool
    {
        $tenantId = $template->tenant_id;

        return DB::transaction(function () use ($template, $tenantId) {
            $locked = ProductTemplate::query()->lockForUpdate()->find($template->id);

            if (! $locked) {
                return false;
            }

            if ($locked->usage_count > 0) {
                throw new \RuntimeException('Cannot delete a template that has been used to create products.');
            }

            $result = $locked->delete();
            $this->clearCache($tenantId);

            return $result;
        });
    }

    /**
     * Create a product from a template.
     */
    public function createProductFromTemplate(
        ProductTemplate $template,
        Shop $shop,
        array $priceData
    ): Product {
        return DB::transaction(function () use ($template, $shop, $priceData) {
            $productName = $priceData['name'] ?? $template->name;
            $product = Product::query()->create([
                'tenant_id' => $shop->tenant_id,
                'shop_id' => $shop->id,
                'template_id' => $template->id,
                'product_type_id' => $template->product_type_id,
                'category_id' => $template->category_id,
                'name' => $productName,
                'slug' => $this->generateUniqueProductSlug($productName, $shop->tenant_id),
                'description' => $priceData['description'] ?? $template->description,
                'custom_attributes' => array_merge(
                    $template->custom_attributes ?? [],
                    $priceData['custom_attributes'] ?? []
                ),
                'has_variants' => $template->has_variants,
                'is_active' => $priceData['is_active'] ?? true,
                'seo_metadata' => $template->seo_metadata,
            ]);

            $structure = $template->template_structure;
            $variants = $structure['variants'] ?? [];

            if (empty($variants)) {
                $variants = [[
                    'name' => 'Default',
                    'attributes' => [],
                    'packaging_types' => $structure['packaging_types'] ?? [],
                ]];
            }

            foreach ($variants as $index => $variantData) {
                $variantPrices = $priceData['variants'][$index] ?? [];

                $sku = $this->generateSku(
                    $shop,
                    $template->name,
                    $variantData['name'] ?? 'Default'
                );

                $variant = ProductVariant::query()->create([
                    'product_id' => $product->id,
                    'sku' => $variantPrices['sku'] ?? $sku,
                    'barcode' => $variantPrices['barcode'] ?? null,
                    'name' => $variantData['name'] ?? 'Default',
                    'attributes' => $variantData['attributes'] ?? [],
                    'price' => $variantPrices['price'] ?? 0,
                    'cost_price' => $variantPrices['cost_price'] ?? 0,
                ]);

                $packagingTypes = $variantData['packaging_types'] ?? [];
                foreach ($packagingTypes as $pkgIndex => $pkgData) {
                    $pkgPrices = $variantPrices['packaging_types'][$pkgIndex] ?? [];

                    ProductPackagingType::query()->create([
                        'tenant_id' => $shop->tenant_id,
                        'product_variant_id' => $variant->id,
                        'name' => $pkgData['name'],
                        'display_name' => $pkgData['display_name'] ?? $pkgData['name'],
                        'units_per_package' => $pkgData['units_per_package'],
                        'price' => $pkgPrices['price'] ?? ($variant->price * ($pkgData['price_multiplier'] ?? $pkgData['units_per_package'])),
                        'is_base_unit' => $pkgData['is_base_unit'] ?? ($pkgIndex === 0),
                        'can_break_down' => $pkgData['can_break_down'] ?? true,
                        'display_order' => $pkgIndex,
                    ]);
                }
            }

            // Invalidate only product list cache since this is a new product
            Cache::tags(["tenant:{$shop->tenant_id}:products:list"])->flush();

            return $product->load(['variants.packagingTypes', 'type', 'category']);
        });
    }

    /**
     * Generate a unique SKU for a variant.
     */
    protected function generateSku(Shop $shop, string $productName, string $variantName): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $shop->name), 0, 3));
        $productCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $productName), 0, 4));
        $variantCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $variantName), 0, 3));
        $random = strtoupper(Str::random(4));

        return "{$prefix}-{$productCode}-{$variantCode}-{$random}";
    }

    /**
     * Clear template cache.
     */
    protected function clearCache(?int $tenantId): void
    {
        Cache::forget('product_templates:system');
        Cache::forget('product_templates:system:list');

        if ($tenantId) {
            Cache::tags(["tenant:{$tenantId}:templates:list"])->flush();
        }
    }

    /**
     * Return product types and system categories for admin create/edit forms.
     *
     * @return array{productTypes: \Illuminate\Database\Eloquent\Collection, categories: \Illuminate\Database\Eloquent\Collection}
     */
    public function getAdminFormOptions(): array
    {
        return [
            'productTypes' => ProductType::query()->orderBy('label')->get(),
            'categories' => ProductCategory::query()->whereNull('tenant_id')->orderBy('name')->get(),
        ];
    }

    private function generateUniqueTemplateSlug(string $name, ?int $tenantId, ?int $excludeId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            ProductTemplate::query()
                ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
                ->where('slug', $slug)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->lockForUpdate()
                ->exists()
        ) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private function generateUniqueProductSlug(string $name, int $tenantId): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (Product::query()->where('tenant_id', $tenantId)->where('slug', $slug)->lockForUpdate()->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Get template statistics.
     */
    public function getStatistics(?int $tenantId = null): array
    {
        $query = ProductTemplate::query();

        if ($tenantId) {
            $query->availableFor($tenantId);
        }

        return [
            'total' => $query->count(),
            'system' => ProductTemplate::query()->system()->availableFor($tenantId)->count(),
            'active' => $query->active()->count(),
            'total_usage' => \App\Models\Product::query()
                ->whereNotNull('template_id')
                ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
                ->count(),
        ];
    }
}
