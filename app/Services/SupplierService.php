<?php

namespace App\Services;

use App\Enums\CatalogVisibility;
use App\Models\Product;
use App\Models\SupplierCatalogItem;
use App\Models\SupplierPricingTier;
use App\Models\SupplierProfile;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SupplierService
{
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

    public function addToCatalog(Tenant $supplierTenant, Product $product, array $data): SupplierCatalogItem
    {
        return DB::transaction(function () use ($supplierTenant, $product, $data) {
            $catalogItem = SupplierCatalogItem::create([
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

            return $catalogItem->fresh(['pricingTiers']);
        });
    }

    public function updateCatalogItem(SupplierCatalogItem $catalogItem, array $data): SupplierCatalogItem
    {
        return DB::transaction(function () use ($catalogItem, $data) {
            $catalogItem->update($data);

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
        return SupplierPricingTier::create([
            'catalog_item_id' => $catalogItem->id,
            'connection_id' => $connectionId,
            'min_quantity' => $data['min_quantity'],
            'max_quantity' => $data['max_quantity'] ?? null,
            'price' => $data['price'],
        ]);
    }

    public function getAvailableCatalog(Tenant $supplierTenant, ?Tenant $buyerTenant = null): Collection
    {
        $query = SupplierCatalogItem::forSupplier($supplierTenant->id)
            ->available()
            ->with(['product.variants', 'pricingTiers']);

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
                return $connectionTier;
            }
        }

        return $tiersQuery->whereNull('connection_id')->first();
    }
}
