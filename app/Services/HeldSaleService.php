<?php

namespace App\Services;

use App\Models\HeldSale;
use App\Models\InventoryLocation;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HeldSaleService
{
    /**
     * Hold a sale for later retrieval.
     * Uses pessimistic locking to prevent race conditions on reference generation.
     * Reserves stock to prevent overselling while sale is held.
     *
     * @throws \Throwable
     */
    public function holdSale(
        Shop $shop,
        array $items,
        ?int $customerId = null,
        ?string $notes = null
    ): HeldSale {
        return DB::transaction(function () use ($shop, $items, $customerId, $notes) {
            $variantIds = collect($items)->pluck('variant_id')->unique()->all();

            $variants = ProductVariant::query()
                ->with('product')
                ->whereIn('id', $variantIds)
                ->get()
                ->keyBy('id');

            $packagingIds = collect($items)->pluck('packaging_type_id')->filter()->unique()->all();
            $packagingTypes = $packagingIds === []
                ? collect()
                : ProductPackagingType::query()->whereIn('id', $packagingIds)->get()->keyBy('id');

            $locations = InventoryLocation::query()
                ->where('location_type', Shop::class)
                ->where('location_id', $shop->id)
                ->whereIn('product_variant_id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_variant_id');

            $snapshotItems = [];

            foreach ($items as $item) {
                $variantId = $item['variant_id'];
                $variant = $variants->get($variantId);

                if (! $variant) {
                    throw new \Exception("Product variant {$variantId} not found");
                }

                $location = $locations->get($variantId);

                if (! $location) {
                    throw new \Exception("Inventory location not found for variant ID {$variantId}");
                }

                $availableStock = $location->quantity - $location->reserved_quantity;

                if ($availableStock < $item['quantity']) {
                    throw new \Exception(
                        "Insufficient stock to hold. Only {$availableStock} units available for variant ID {$variantId}"
                    );
                }

                $location->increment('reserved_quantity', $item['quantity']);

                $packagingType = isset($item['packaging_type_id'])
                    ? $packagingTypes->get($item['packaging_type_id'])
                    : null;

                $snapshotItems[] = [
                    'variant_id' => $variantId,
                    'name' => $variant->name ?: $variant->product?->name,
                    'sku' => $variant->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => (float) ($packagingType?->price ?? $variant->price),
                    'packaging_type_id' => $packagingType?->id,
                ];
            }

            $holdReference = $this->generateHoldReference($shop->id);

            return HeldSale::query()->create([
                'tenant_id' => auth()->user()->tenant_id,
                'shop_id' => $shop->id,
                'hold_reference' => $holdReference,
                'customer_id' => $customerId,
                'items' => $snapshotItems,
                'notes' => $notes,
                'held_by' => auth()->id(),
            ]);
        });
    }

    /**
     * Generate a unique hold reference for the shop.
     * Uses pessimistic locking to serialize concurrent requests.
     */
    protected function generateHoldReference(int $shopId): string
    {
        $lastHold = HeldSale::where('shop_id', $shopId)
            ->orderBy('id', 'desc')
            ->lockForUpdate()
            ->first();

        $sequence = 1;
        if ($lastHold && preg_match('/HOLD-(\d+)$/', $lastHold->hold_reference, $matches)) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('HOLD-%03d', $sequence);
    }

    /**
     * Retrieve a held sale and mark it as retrieved
     */
    public function retrieveHeldSale(HeldSale $heldSale): HeldSale
    {
        if ($heldSale->isRetrieved()) {
            throw new \Exception('This held sale has already been retrieved.');
        }

        if ($heldSale->isExpired()) {
            $this->deleteHeldSale($heldSale);
            throw new \Exception('This held sale has expired and the reserved stock has been released.');
        }

        $heldSale->update([
            'retrieved_at' => now(),
            'retrieved_by' => auth()->id(),
        ]);

        return $heldSale->fresh();
    }

    /**
     * Delete a held sale and release reserved stock
     */
    public function deleteHeldSale(HeldSale $heldSale): bool
    {
        return DB::transaction(function () use ($heldSale) {
            $variantIds = collect($heldSale->items)->pluck('variant_id')->toArray();

            $locations = InventoryLocation::where('location_type', Shop::class)
                ->where('location_id', $heldSale->shop_id)
                ->whereIn('product_variant_id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_variant_id');

            foreach ($heldSale->items as $item) {
                $location = $locations->get($item['variant_id']);

                if ($location && $location->reserved_quantity >= $item['quantity']) {
                    $location->decrement('reserved_quantity', $item['quantity']);
                }
            }

            return $heldSale->delete();
        });
    }

    /**
     * Get all active (not retrieved) held sales for a shop
     */
    public function getActiveHeldSales(Shop $shop): Collection
    {
        $this->cleanupExpiredHeldSalesForShop($shop);

        return HeldSale::forTenant(auth()->user()->tenant_id)
            ->forShop($shop->id)
            ->active()
            ->notExpired()
            ->with(['customer', 'heldByUser'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get count of active held sales for a shop
     */
    public function getActiveCount(Shop $shop): int
    {
        return HeldSale::forTenant(auth()->user()->tenant_id)
            ->forShop($shop->id)
            ->active()
            ->notExpired()
            ->count();
    }

    /**
     * Get a single held sale by ID with relationships loaded
     */
    public function getHeldSale(int $heldSaleId): ?HeldSale
    {
        return HeldSale::forTenant(auth()->user()->tenant_id)
            ->notExpired()
            ->with(['customer', 'heldByUser'])
            ->find($heldSaleId);
    }

    /**
     * Clean up expired held sales and release reserved stock (for scheduled task)
     */
    private function cleanupExpiredHeldSalesForShop(Shop $shop): void
    {
        $expiredSales = HeldSale::forShop($shop->id)
            ->expired()
            ->limit(10)
            ->get();

        foreach ($expiredSales as $heldSale) {
            try {
                $this->deleteHeldSale($heldSale);
            } catch (\Exception $e) {
                Log::error('Failed to cleanup expired held sale inline', [
                    'held_sale_id' => $heldSale->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    public function cleanupExpiredHeldSales(): int
    {
        $expiredSales = HeldSale::expired()->get();
        $deletedCount = 0;

        foreach ($expiredSales as $heldSale) {
            try {
                DB::transaction(function () use ($heldSale) {
                    $variantIds = collect($heldSale->items)->pluck('variant_id')->toArray();

                    $locations = InventoryLocation::where('location_type', Shop::class)
                        ->where('location_id', $heldSale->shop_id)
                        ->whereIn('product_variant_id', $variantIds)
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('product_variant_id');

                    foreach ($heldSale->items as $item) {
                        $location = $locations->get($item['variant_id']);

                        if ($location && $location->reserved_quantity >= $item['quantity']) {
                            $location->decrement('reserved_quantity', $item['quantity']);
                        }
                    }

                    $heldSale->delete();
                });

                $deletedCount++;
            } catch (\Exception $e) {
                Log::error('Failed to cleanup expired held sale', [
                    'held_sale_id' => $heldSale->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $deletedCount;
    }
}
