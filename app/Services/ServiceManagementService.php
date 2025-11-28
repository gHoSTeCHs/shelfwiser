<?php

namespace App\Services;

use App\Models\Service;
use App\Models\ServiceAddon;
use App\Models\ServiceCategory;
use App\Models\ServiceVariant;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ServiceManagementService
{
    /**
     * Create a new service with variants
     *
     * @throws Throwable
     */
    public function create(array $data, Tenant $tenant, Shop $shop): Service
    {
        Log::info('Service creation process started.', [
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'data' => $data,
        ]);

        try {
            return DB::transaction(function () use ($data, $tenant, $shop) {
                $slug = $this->generateUniqueSlug($data['name'], $shop);

                $serviceData = [
                    'tenant_id' => $tenant->id,
                    'shop_id' => $shop->id,
                    'service_category_id' => $data['service_category_id'] ?? null,
                    'name' => $data['name'],
                    'slug' => $slug,
                    'description' => $data['description'] ?? null,
                    'image_url' => $data['image_url'] ?? null,
                    'has_material_options' => $data['has_material_options'] ?? false,
                    'is_active' => $data['is_active'] ?? true,
                    'is_available_online' => $data['is_available_online'] ?? true,
                ];

                $service = Service::create($serviceData);

                // Create variants
                if (isset($data['variants']) && is_array($data['variants'])) {
                    foreach ($data['variants'] as $index => $variantData) {
                        $this->createVariant($service, $variantData, $index);
                    }
                }

                // Invalidate only list cache, not individual service caches
                Cache::tags(["tenant:$tenant->id:services:list"])->flush();

                Log::info('Service created successfully.', ['service_id' => $service->id]);

                return $service->load('category', 'variants', 'addons');
            });
        } catch (Throwable $e) {
            Log::error('Service creation failed.', [
                'tenant_id' => $tenant->id,
                'shop_id' => $shop->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Update an existing service
     *
     * @throws Throwable
     */
    public function update(Service $service, array $data): Service
    {
        Log::info('Service update process started.', [
            'service_id' => $service->id,
            'data' => $data,
        ]);

        try {
            return DB::transaction(function () use ($service, $data) {
                // Update slug if name changed
                if (isset($data['name']) && $data['name'] !== $service->name) {
                    $data['slug'] = $this->generateUniqueSlug($data['name'], $service->shop, $service->id);
                }

                $service->update($data);

                // Invalidate specific service cache and list cache
                Cache::tags([
                    "tenant:$service->tenant_id:services:list",
                    "tenant:$service->tenant_id:service:$service->id",
                ])->flush();

                Log::info('Service updated successfully.', ['service_id' => $service->id]);

                return $service->fresh(['category', 'variants', 'addons']);
            });
        } catch (Throwable $e) {
            Log::error('Service update failed.', [
                'service_id' => $service->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Delete a service
     *
     * @throws Throwable
     */
    public function delete(Service $service): bool
    {
        Log::info('Service deletion process started.', ['service_id' => $service->id]);

        try {
            return DB::transaction(function () use ($service) {
                $tenantId = $service->tenant_id;

                // Delete variants (cascade will handle addons)
                $service->variants()->delete();

                // Delete service-specific addons
                $service->addons()->delete();

                $service->delete();

                // Invalidate specific service cache and list cache
                Cache::tags([
                    "tenant:$tenantId:services:list",
                    "tenant:$tenantId:service:$service->id",
                ])->flush();

                Log::info('Service deleted successfully.', ['service_id' => $service->id]);

                return true;
            });
        } catch (Throwable $e) {
            Log::error('Service deletion failed.', [
                'service_id' => $service->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Create a service variant
     *
     * @throws Throwable
     */
    public function createVariant(Service $service, array $data, int $sortOrder = 0): ServiceVariant
    {
        Log::info('Service variant creation started.', [
            'service_id' => $service->id,
            'data' => $data,
        ]);

        try {
            $variantData = [
                'service_id' => $service->id,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'base_price' => $data['base_price'],
                'customer_materials_price' => $data['customer_materials_price'] ?? null,
                'shop_materials_price' => $data['shop_materials_price'] ?? null,
                'estimated_duration_minutes' => $data['estimated_duration_minutes'] ?? null,
                'sort_order' => $data['sort_order'] ?? $sortOrder,
                'is_active' => $data['is_active'] ?? true,
            ];

            $variant = ServiceVariant::query()->create($variantData);

            // Invalidate parent service and list cache
            Cache::tags([
                "tenant:$service->tenant_id:services:list",
                "tenant:$service->tenant_id:service:$service->id",
            ])->flush();

            Log::info('Service variant created successfully.', ['variant_id' => $variant->id]);

            return $variant;
        } catch (Throwable $e) {
            Log::error('Service variant creation failed.', [
                'service_id' => $service->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Update a service variant
     *
     * @throws Throwable
     */
    public function updateVariant(ServiceVariant $variant, array $data): ServiceVariant
    {
        Log::info('Service variant update started.', [
            'variant_id' => $variant->id,
            'data' => $data,
        ]);

        try {
            $variant->update($data);

            // Invalidate parent service and list cache
            Cache::tags([
                "tenant:{$variant->service->tenant_id}:services:list",
                "tenant:{$variant->service->tenant_id}:service:{$variant->service_id}",
            ])->flush();

            Log::info('Service variant updated successfully.', ['variant_id' => $variant->id]);

            return $variant->fresh();
        } catch (Throwable $e) {
            Log::error('Service variant update failed.', [
                'variant_id' => $variant->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Delete a service variant
     *
     * @throws Throwable
     */
    public function deleteVariant(ServiceVariant $variant): bool
    {
        Log::info('Service variant deletion started.', ['variant_id' => $variant->id]);

        try {
            $tenantId = $variant->service->tenant_id;
            $serviceId = $variant->service_id;

            $variant->delete();

            // Invalidate parent service and list cache
            Cache::tags([
                "tenant:$tenantId:services:list",
                "tenant:$tenantId:service:$serviceId",
            ])->flush();

            Log::info('Service variant deleted successfully.', ['variant_id' => $variant->id]);

            return true;
        } catch (Throwable $e) {
            Log::error('Service variant deletion failed.', [
                'variant_id' => $variant->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Create a service addon
     *
     * @throws Throwable
     */
    public function createAddon(array $data, ?Service $service = null, ?ServiceCategory $category = null): ServiceAddon
    {
        Log::info('Service addon creation started.', [
            'service_id' => $service?->id,
            'category_id' => $category?->id,
            'data' => $data,
        ]);

        try {
            $addonData = [
                'service_id' => $service?->id,
                'service_category_id' => $category?->id,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'allows_quantity' => $data['allows_quantity'] ?? false,
                'max_quantity' => $data['max_quantity'] ?? null,
                'sort_order' => $data['sort_order'] ?? 0,
                'is_active' => $data['is_active'] ?? true,
            ];

            $addon = ServiceAddon::create($addonData);

            // Invalidate cache based on context (list and specific service)
            if ($service) {
                Cache::tags([
                    "tenant:{$service->tenant_id}:services:list",
                    "tenant:{$service->tenant_id}:service:{$service->id}",
                ])->flush();
            } elseif ($category) {
                Cache::tags(["tenant:{$category->tenant_id}:services:list"])->flush();
            }

            Log::info('Service addon created successfully.', ['addon_id' => $addon->id]);

            return $addon;
        } catch (Throwable $e) {
            Log::error('Service addon creation failed.', [
                'service_id' => $service?->id,
                'category_id' => $category?->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Update a service addon
     *
     * @throws Throwable
     */
    public function updateAddon(ServiceAddon $addon, array $data): ServiceAddon
    {
        Log::info('Service addon update started.', [
            'addon_id' => $addon->id,
            'data' => $data,
        ]);

        try {
            $addon->update($data);

            // Invalidate cache based on context (list and specific service)
            if ($addon->service_id) {
                Cache::tags([
                    "tenant:{$addon->service->tenant_id}:services:list",
                    "tenant:{$addon->service->tenant_id}:service:{$addon->service_id}",
                ])->flush();
            } elseif ($addon->service_category_id) {
                Cache::tags(["tenant:{$addon->category->tenant_id}:services:list"])->flush();
            }

            Log::info('Service addon updated successfully.', ['addon_id' => $addon->id]);

            return $addon->fresh();
        } catch (Throwable $e) {
            Log::error('Service addon update failed.', [
                'addon_id' => $addon->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Delete a service addon
     *
     * @throws Throwable
     */
    public function deleteAddon(ServiceAddon $addon): bool
    {
        Log::info('Service addon deletion started.', ['addon_id' => $addon->id]);

        try {
            // Get tenant ID and service ID before deletion
            $tenantId = $addon->service_id
                ? $addon->service->tenant_id
                : $addon->category->tenant_id;
            $serviceId = $addon->service_id;

            $addon->delete();

            // Invalidate cache based on context (list and specific service)
            if ($serviceId) {
                Cache::tags([
                    "tenant:$tenantId:services:list",
                    "tenant:$tenantId:service:$serviceId",
                ])->flush();
            } else {
                Cache::tags(["tenant:$tenantId:services:list"])->flush();
            }

            Log::info('Service addon deleted successfully.', ['addon_id' => $addon->id]);

            return true;
        } catch (Throwable $e) {
            Log::error('Service addon deletion failed.', [
                'addon_id' => $addon->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Generate a unique slug for a service within a shop
     */
    protected function generateUniqueSlug(string $name, Shop $shop, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug, $shop, $excludeId)) {
            $slug = $originalSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if a slug exists for a shop
     */
    protected function slugExists(string $slug, Shop $shop, ?int $excludeId = null): bool
    {
        $query = Service::query()->where('shop_id', $shop->id)
            ->where('slug', $slug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}
