<?php

namespace App\Services;

use App\Models\HeldSale;
use App\Models\InventoryLocation;
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
            $variantIds = collect($items)->pluck('variant_id')->toArray();

            $locations = InventoryLocation::where('location_type', Shop::class)
                ->where('location_id', $shop->id)
                ->whereIn('product_variant_id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_variant_id');

            foreach ($items as $item) {
                $location = $locations->get($item['variant_id']);

                if (! $location) {
                    throw new \Exception("Inventory location not found for variant ID {$item['variant_id']}");
                }

                $availableStock = $location->quantity - $location->reserved_quantity;

                if ($availableStock < $item['quantity']) {
                    throw new \Exception(
                        "Insufficient stock to hold. Only {$availableStock} units available for variant ID {$item['variant_id']}"
                    );
                }

                $location->increment('reserved_quantity', $item['quantity']);
            }

            $holdReference = $this->generateHoldReference($shop->id);

            return HeldSale::create([
                'tenant_id' => auth()->user()->tenant_id,
                'shop_id' => $shop->id,
                'hold_reference' => $holdReference,
                'customer_id' => $customerId,
                'items' => $items,
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
            ->with(['customer', 'heldByUser'])
            ->find($heldSaleId);
    }

    /**
     * Clean up expired held sales and release reserved stock (for scheduled task)
     */
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
