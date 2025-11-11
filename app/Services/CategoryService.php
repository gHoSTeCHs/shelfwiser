<?php

namespace App\Services;

use App\Models\ProductCategory;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoryService
{
    public function create(array $data, Tenant $tenant): ProductCategory
    {
        return DB::transaction(function () use ($data, $tenant) {
            $slug = $this->generateUniqueSlug($data['name'], $tenant->id);

            $category = ProductCategory::create([
                'tenant_id' => $tenant->id,
                'parent_id' => $data['parent_id'] ?? null,
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearCache($tenant->id);

            return $category->load('parent', 'children');
        });
    }

    public function update(ProductCategory $category, array $data): ProductCategory
    {
        return DB::transaction(function () use ($category, $data) {
            if (isset($data['parent_id']) && $data['parent_id'] === $category->id) {
                throw new \Exception('A category cannot be its own parent.');
            }

            if (isset($data['parent_id']) && $this->wouldCreateCircularReference($category, $data['parent_id'])) {
                throw new \Exception('Cannot set parent: this would create a circular reference.');
            }

            if (isset($data['name']) && $data['name'] !== $category->name) {
                $data['slug'] = $this->generateUniqueSlug($data['name'], $category->tenant_id, $category->id);
            }

            $category->update($data);

            $this->clearCache($category->tenant_id);

            return $category->fresh(['parent', 'children']);
        });
    }

    public function delete(ProductCategory $category): bool
    {
        return DB::transaction(function () use ($category) {
            if ($category->products()->exists()) {
                throw new \Exception('Cannot delete category with associated products. Please reassign or delete the products first.');
            }

            if ($category->children()->exists()) {
                throw new \Exception('Cannot delete category with subcategories. Please delete or reassign the subcategories first.');
            }

            $tenantId = $category->tenant_id;
            $deleted = $category->delete();

            if ($deleted) {
                $this->clearCache($tenantId);
            }

            return $deleted;
        });
    }

    public function getCategoryTree(int $tenantId, ?int $parentId = null): array
    {
        $cacheKey = "tenant:{$tenantId}:category_tree:" . ($parentId ?? 'root');

        return Cache::tags(["tenant:{$tenantId}:categories"])
            ->remember($cacheKey, 3600, function () use ($tenantId, $parentId) {
                $categories = ProductCategory::where('tenant_id', $tenantId)
                    ->where('parent_id', $parentId)
                    ->where('is_active', true)
                    ->with(['children' => function ($query) {
                        $query->where('is_active', true)->withCount('products');
                    }])
                    ->withCount('products')
                    ->orderBy('name')
                    ->get();

                return $categories->map(function ($category) use ($tenantId) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'products_count' => $category->products_count,
                        'children' => $this->getCategoryTree($tenantId, $category->id),
                    ];
                })->toArray();
            });
    }

    public function getBreadcrumbs(ProductCategory $category): array
    {
        $breadcrumbs = [];
        $current = $category;

        while ($current) {
            array_unshift($breadcrumbs, [
                'id' => $current->id,
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }

        return $breadcrumbs;
    }

    protected function generateUniqueSlug(string $name, int $tenantId, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug, $tenantId, $excludeId)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    protected function slugExists(string $slug, int $tenantId, ?int $excludeId = null): bool
    {
        $query = ProductCategory::where('tenant_id', $tenantId)
            ->where('slug', $slug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    protected function wouldCreateCircularReference(ProductCategory $category, ?int $newParentId): bool
    {
        if (!$newParentId) {
            return false;
        }

        $current = ProductCategory::find($newParentId);

        while ($current) {
            if ($current->id === $category->id) {
                return true;
            }
            $current = $current->parent;
        }

        return false;
    }

    protected function clearCache(int $tenantId): void
    {
        Cache::tags(["tenant:{$tenantId}:categories"])->flush();
    }
}
