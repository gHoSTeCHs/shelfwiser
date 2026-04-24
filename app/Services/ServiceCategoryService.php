<?php

namespace App\Services;

use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Collection;

class ServiceCategoryService
{
    public function getRootCategories(): Collection
    {
        return ServiceCategory::query()
            ->whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->orderBy('sort_order')])
            ->withCount('services')
            ->orderBy('sort_order')
            ->get();
    }

    public function getParentCategories(?int $excludeId = null): Collection
    {
        return ServiceCategory::query()
            ->whereNull('parent_id')
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug']);
    }

    public function createCategory(int $tenantId, array $validated): ServiceCategory
    {
        return ServiceCategory::query()->create([
            'tenant_id' => $tenantId,
            ...$validated,
        ]);
    }

    public function updateCategory(ServiceCategory $category, array $validated): void
    {
        $category->update($validated);
    }

    public function deleteCategory(ServiceCategory $category): void
    {
        $category->delete();
    }
}
