<?php

namespace App\Services;

use App\Models\HeldSale;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class HeldSaleService
{
    /**
     * Hold a sale for later retrieval
     */
    public function holdSale(
        Shop $shop,
        array $items,
        ?int $customerId = null,
        ?string $notes = null
    ): HeldSale {
        return DB::transaction(function () use ($shop, $items, $customerId, $notes) {
            return HeldSale::create([
                'tenant_id' => auth()->user()->tenant_id,
                'shop_id' => $shop->id,
                'customer_id' => $customerId,
                'items' => $items,
                'notes' => $notes,
                'held_by' => auth()->id(),
            ]);
        });
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
     * Delete a held sale
     */
    public function deleteHeldSale(HeldSale $heldSale): bool
    {
        return $heldSale->delete();
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
     * Clean up expired held sales (for scheduled task)
     */
    public function cleanupExpiredHeldSales(): int
    {
        return HeldSale::expired()->delete();
    }
}
