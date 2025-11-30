<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

class ReorderAlertService
{
    /**
     * Get all product variants that are below their reorder level
     */
    public function getLowStockVariants(Tenant $tenant, ?Shop $shop = null): Collection
    {
        $query = ProductVariant::query()
            ->whereHas('product', function ($q) use ($tenant, $shop) {
                $q->where('tenant_id', $tenant->id);
                if ($shop) {
                    $q->where('shop_id', $shop->id);
                }
            })
            ->with([
                'product:id,name,shop_id',
                'product.shop:id,name',
                'inventoryLocations',
            ])
            ->where('is_active', true)
            ->where('reorder_level', '>', 0);

        return $query->get()->filter(function ($variant) use ($shop) {
            $totalStock = $this->getTotalStock($variant, $shop);
            return $totalStock <= $variant->reorder_level;
        })->map(function ($variant) use ($shop) {
            $totalStock = $this->getTotalStock($variant, $shop);
            return [
                'variant' => $variant,
                'current_stock' => $totalStock,
                'reorder_level' => $variant->reorder_level,
                'shortage' => $variant->reorder_level - $totalStock,
                'percentage' => $variant->reorder_level > 0
                    ? round(($totalStock / $variant->reorder_level) * 100, 1)
                    : 100,
            ];
        })->sortBy('percentage')->values();
    }

    /**
     * Get critical stock items (below 25% of reorder level)
     */
    public function getCriticalStockVariants(Tenant $tenant, ?Shop $shop = null): Collection
    {
        return $this->getLowStockVariants($tenant, $shop)
            ->filter(fn ($item) => $item['percentage'] < 25);
    }

    /**
     * Get total stock for a variant across all locations (or specific shop)
     */
    private function getTotalStock(ProductVariant $variant, ?Shop $shop = null): int
    {
        if ($shop) {
            return $variant->inventoryLocations
                ->where('location_type', 'App\\Models\\Shop')
                ->where('location_id', $shop->id)
                ->sum('quantity');
        }

        return $variant->inventoryLocations->sum('quantity');
    }

    /**
     * Check if variant is below reorder level
     */
    public function isLowStock(ProductVariant $variant, ?Shop $shop = null): bool
    {
        if (!$variant->reorder_level || $variant->reorder_level <= 0) {
            return false;
        }

        $totalStock = $this->getTotalStock($variant, $shop);
        return $totalStock <= $variant->reorder_level;
    }

    /**
     * Get reorder alert summary for dashboard
     */
    public function getAlertSummary(Tenant $tenant, ?Shop $shop = null): array
    {
        $cacheKey = "reorder_alerts_{$tenant->id}" . ($shop ? "_{$shop->id}" : '');

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($tenant, $shop) {
            $lowStock = $this->getLowStockVariants($tenant, $shop);
            $critical = $lowStock->filter(fn ($item) => $item['percentage'] < 25);
            $warning = $lowStock->filter(fn ($item) => $item['percentage'] >= 25 && $item['percentage'] < 50);

            return [
                'total_low_stock' => $lowStock->count(),
                'critical_count' => $critical->count(),
                'warning_count' => $warning->count(),
                'critical_items' => $critical->take(5),
                'top_priority' => $lowStock->take(10),
            ];
        });
    }

    /**
     * Clear cache for reorder alerts
     */
    public function clearCache(Tenant $tenant, ?Shop $shop = null): void
    {
        $cacheKey = "reorder_alerts_{$tenant->id}" . ($shop ? "_{$shop->id}" : '');
        Cache::forget($cacheKey);
    }

    /**
     * Generate purchase order suggestions based on low stock
     */
    public function getSuggestedPurchaseOrders(Tenant $tenant, Shop $shop): Collection
    {
        $lowStock = $this->getLowStockVariants($tenant, $shop);

        // Group by supplier if available
        return $lowStock->groupBy(function ($item) {
            return $item['variant']->product->supplier_id ?? 'no_supplier';
        })->map(function ($items, $supplierId) {
            return [
                'supplier_id' => $supplierId !== 'no_supplier' ? $supplierId : null,
                'items' => $items->map(function ($item) {
                    $suggestedQuantity = max(
                        $item['shortage'],
                        $item['variant']->reorder_level * 2 // Order 2x reorder level
                    );

                    return [
                        'variant_id' => $item['variant']->id,
                        'sku' => $item['variant']->sku,
                        'name' => $item['variant']->product->name . ' - ' . $item['variant']->name,
                        'current_stock' => $item['current_stock'],
                        'reorder_level' => $item['reorder_level'],
                        'suggested_quantity' => $suggestedQuantity,
                        'cost_price' => $item['variant']->cost_price,
                        'total_cost' => $suggestedQuantity * ($item['variant']->cost_price ?? 0),
                    ];
                }),
                'total_items' => $items->count(),
                'total_cost' => $items->sum(function ($item) {
                    $suggestedQuantity = max(
                        $item['shortage'],
                        $item['variant']->reorder_level * 2
                    );
                    return $suggestedQuantity * ($item['variant']->cost_price ?? 0);
                }),
            ];
        });
    }
}
