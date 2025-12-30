<?php

namespace Database\Seeders;

use App\Models\InventoryLocation;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class InventoryLocationSeeder extends Seeder
{
    public function run(): void
    {
        $shops = Shop::with(['products.variants'])->get();

        foreach ($shops as $shop) {
            foreach ($shop->products as $product) {
                foreach ($product->variants as $variant) {
                    $this->createInventoryLocation($variant, $shop);
                }
            }
        }
    }

    protected function createInventoryLocation(ProductVariant $variant, Shop $shop): void
    {
        $quantity = $this->determineInitialQuantity($variant);
        $reservedQuantity = $this->determineReservedQuantity($quantity);

        InventoryLocation::create([
            'tenant_id' => $shop->tenant_id,
            'product_variant_id' => $variant->id,
            'location_type' => Shop::class,
            'location_id' => $shop->id,
            'quantity' => $quantity,
            'reserved_quantity' => $reservedQuantity,
        ]);
    }

    protected function determineInitialQuantity(ProductVariant $variant): int
    {
        $basePrice = (float) $variant->price;
        $reorderLevel = $variant->reorder_level ?? 10;

        if ($basePrice >= 100000) {
            return rand($reorderLevel, $reorderLevel * 2);
        }

        if ($basePrice >= 10000) {
            return rand($reorderLevel * 2, $reorderLevel * 4);
        }

        if ($basePrice >= 1000) {
            return rand($reorderLevel * 3, $reorderLevel * 6);
        }

        if ($basePrice >= 500) {
            return rand($reorderLevel * 4, $reorderLevel * 8);
        }

        return rand($reorderLevel * 5, $reorderLevel * 10);
    }

    protected function determineReservedQuantity(int $totalQuantity): int
    {
        $reservePercentage = rand(0, 20) / 100;

        return (int) floor($totalQuantity * $reservePercentage);
    }
}
