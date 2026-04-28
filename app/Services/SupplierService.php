<?php

namespace App\Services;

use App\Enums\CatalogVisibility;
use App\Models\Product;
use App\Models\SupplierCatalogItem;
use App\Models\SupplierPricingTier;
use App\Models\SupplierProfile;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class SupplierService
{
    /** @var array<int, array<string, SupplierPricingTier|null>> */
    private array $tierCache = [];

    public function enableSupplierMode(Tenant $tenant, array $data): SupplierProfile
    {
        return DB::transaction(function () use ($tenant, $data) {
            $profile = SupplierProfile::updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'is_enabled' => true,
                    'business_registration' => $data['business_registration'] ?? null,
                    'tax_id' => $data['tax_id'] ?? null,
                    'payment_terms' => $data['payment_terms'] ?? 'Net 30',
                    'lead_time_days' => $data['lead_time_days'] ?? 7,
                    'minimum_order_value' => $data['minimum_order_value'] ?? 0,
                    'connection_approval_mode' => $data['connection_approval_mode'],
                    'settings' => $data['settings'] ?? [],
                ]
            );

            Log::info('Supplier mode enabled', [
                'tenant_id' => $tenant->id,
                'profile_id' => $profile->id,
            ]);

            return $profile;
        });
    }

    public function disableSupplierMode(Tenant $tenant): void
    {
        DB::transaction(function () use ($tenant) {
            $profile = $tenant->supplierProfile;

            if ($profile) {
                $profile->update(['is_enabled' => false]);

                Log::info('Supplier mode disabled', [
                    'tenant_id' => $tenant->id,
                ]);
            }
        });
    }

    public function updateSupplierProfile(SupplierProfile $profile, array $data): SupplierProfile
    {
        return DB::transaction(function () use ($profile, $data) {
            $profile->update($data);

            Log::info('Supplier profile updated', [
                'profile_id' => $profile->id,
                'tenant_id' => $profile->tenant_id,
            ]);

            return $profile->fresh();
        });
    }

    public function getCatalogItems(Tenant $tenant): LengthAwarePaginator
    {
        return SupplierCatalogItem::query()
            ->forSupplier($tenant->id)
            ->with(['product.variants', 'pricingTiers'])
            ->latest()
            ->paginate(20);
    }

    public function getProductsNotInCatalog(): Collection
    {
        return Product::query()
            ->with(['variants', 'shop'])
            ->whereDoesntHave('supplierCatalogItem')
            ->latest()
            ->get();
    }

    public function addToCatalog(Tenant $supplierTenant, array $data): SupplierCatalogItem
    {
        return DB::transaction(function () use ($supplierTenant, $data) {
            $product = Product::query()
                ->where('tenant_id', $supplierTenant->id)
                ->findOrFail($data['product_id']);

            $catalogItem = SupplierCatalogItem::query()->create([
                'supplier_tenant_id' => $supplierTenant->id,
                'product_id' => $product->id,
                'is_available' => $data['is_available'] ?? true,
                'base_wholesale_price' => $data['base_wholesale_price'],
                'min_order_quantity' => $data['min_order_quantity'] ?? 1,
                'visibility' => $data['visibility'] ?? CatalogVisibility::CONNECTIONS_ONLY,
                'description' => $data['description'] ?? null,
            ]);

            if (isset($data['pricing_tiers']) && is_array($data['pricing_tiers'])) {
                foreach ($data['pricing_tiers'] as $tier) {
                    $this->addPricingTier($catalogItem, $tier);
                }
            }

            Log::info('Product added to supplier catalog', [
                'catalog_item_id' => $catalogItem->id,
                'product_id' => $product->id,
                'supplier_tenant_id' => $supplierTenant->id,
            ]);

            return $catalogItem->fresh(['product', 'pricingTiers']);
        });
    }

    public function updateCatalogItem(SupplierCatalogItem $catalogItem, array $data): SupplierCatalogItem
    {
        return DB::transaction(function () use ($catalogItem, $data) {
            $catalogItem->update(Arr::only($data, [
                'is_available', 'base_wholesale_price', 'min_order_quantity', 'visibility', 'description',
            ]));

            if (isset($data['pricing_tiers']) && is_array($data['pricing_tiers'])) {
                $catalogItem->pricingTiers()->whereNull('connection_id')->delete();

                foreach ($data['pricing_tiers'] as $tier) {
                    $this->addPricingTier($catalogItem, $tier);
                }
            }

            Log::info('Catalog item updated', [
                'catalog_item_id' => $catalogItem->id,
            ]);

            return $catalogItem->fresh(['pricingTiers']);
        });
    }

    public function removeFromCatalog(SupplierCatalogItem $catalogItem): void
    {
        DB::transaction(function () use ($catalogItem) {
            $catalogItemId = $catalogItem->id;

            $catalogItem->delete();

            Log::info('Product removed from supplier catalog', [
                'catalog_item_id' => $catalogItemId,
            ]);
        });
    }

    public function addPricingTier(SupplierCatalogItem $catalogItem, array $data, ?int $connectionId = null): SupplierPricingTier
    {
        return SupplierPricingTier::query()->create([
            'catalog_item_id' => $catalogItem->id,
            'connection_id' => $connectionId,
            'min_quantity' => $data['min_quantity'],
            'max_quantity' => $data['max_quantity'] ?? null,
            'price' => $data['price'],
        ]);
    }

    public function getAvailableCatalog(?Tenant $supplierTenant = null, ?Tenant $buyerTenant = null): Collection
    {
        $query = SupplierCatalogItem::query()
            ->available()
            ->with(['product.variants', 'pricingTiers', 'supplierTenant']);

        if ($supplierTenant) {
            $query->forSupplier($supplierTenant->id);
        }

        if ($buyerTenant) {
            $query->visibleTo($buyerTenant->id);
        } else {
            $query->where('visibility', CatalogVisibility::PUBLIC);
        }

        return $query->get();
    }

    public function getCatalogItemWithPrice(int $catalogItemId, int $quantity, ?int $connectionId = null): array
    {
        $catalogItem = SupplierCatalogItem::with(['product', 'pricingTiers'])
            ->findOrFail($catalogItemId);

        $price = $catalogItem->getPriceForQuantity($quantity, $connectionId);

        return [
            'catalog_item' => $catalogItem,
            'unit_price' => $price,
            'total_price' => $price * $quantity,
            'applied_tier' => $this->getAppliedTier($catalogItem, $quantity, $connectionId),
        ];
    }

    protected function getAppliedTier(SupplierCatalogItem $catalogItem, int $quantity, ?int $connectionId): ?SupplierPricingTier
    {
        $cacheKey = "{$quantity}:{$connectionId}";

        if (isset($this->tierCache[$catalogItem->id][$cacheKey])) {
            return $this->tierCache[$catalogItem->id][$cacheKey];
        }

        $tier = null;

        if (isset($this->tierCache[$catalogItem->id]['_tiers'])) {
            $matching = $this->tierCache[$catalogItem->id]['_tiers']
                ->filter(fn ($t) => $t->min_quantity <= $quantity &&
                    (is_null($t->max_quantity) || $t->max_quantity >= $quantity))
                ->sortByDesc('min_quantity');

            if ($connectionId) {
                $tier = $matching->firstWhere('connection_id', $connectionId);
            }

            if (! $tier) {
                $tier = $matching->first(fn ($t) => is_null($t->connection_id));
            }
        } else {
            $tiersQuery = $catalogItem->pricingTiers()
                ->where('min_quantity', '<=', $quantity)
                ->where(function ($query) use ($quantity) {
                    $query->whereNull('max_quantity')
                        ->orWhere('max_quantity', '>=', $quantity);
                })
                ->orderBy('min_quantity', 'desc');

            if ($connectionId) {
                $connectionTier = (clone $tiersQuery)
                    ->where('connection_id', $connectionId)
                    ->first();

                if ($connectionTier) {
                    $tier = $connectionTier;
                }
            }

            if (! $tier) {
                $tier = $tiersQuery->whereNull('connection_id')->first();
            }
        }

        if (! isset($this->tierCache[$catalogItem->id])) {
            $this->tierCache[$catalogItem->id] = [];
        }
        $this->tierCache[$catalogItem->id][$cacheKey] = $tier;

        return $tier;
    }

    /**
     * Clears the pricing tier cache. Call this when tier data might have changed.
     */
    public function clearTierCache(): void
    {
        $this->tierCache = [];
    }

    /**
     * Preload pricing tiers for multiple catalog items to avoid N+1 queries.
     *
     * @param  array<int>  $catalogItemIds
     */
    public function preloadPricingTiers(array $catalogItemIds): void
    {
        $tiers = SupplierPricingTier::whereIn('catalog_item_id', $catalogItemIds)->get();

        foreach ($tiers->groupBy('catalog_item_id') as $catalogItemId => $itemTiers) {
            if (! isset($this->tierCache[$catalogItemId])) {
                $this->tierCache[$catalogItemId] = ['_tiers' => $itemTiers];
            }
        }
    }
}
