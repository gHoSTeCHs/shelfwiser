<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\InventoryLocation;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
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

        $location = InventoryLocation::create([
            'tenant_id' => $shop->tenant_id,
            'shop_id' => $shop->id,
            'product_variant_id' => $variant->id,
            'location_type' => Shop::class,
            'location_id' => $shop->id,
            'quantity' => $quantity,
            'reserved_quantity' => $reservedQuantity,
        ]);

        if ($quantity > 0) {
            $this->createInitialStockMovement($location, $quantity, $shop);
        }
    }

    /**
     * Create initial stock movement record for seeded inventory
     */
    protected function createInitialStockMovement(
        InventoryLocation $location,
        int $quantity,
        Shop $shop
    ): void {
        $user = $this->getRandomStaff($shop->tenant_id);

        StockMovement::create([
            'tenant_id' => $shop->tenant_id,
            'shop_id' => $shop->id,
            'product_variant_id' => $location->product_variant_id,
            'to_location_id' => $location->id,
            'type' => StockMovementType::ADJUSTMENT_IN,
            'quantity' => $quantity,
            'quantity_before' => 0,
            'quantity_after' => $quantity,
            'reference_number' => $this->generateReferenceNumber(),
            'reason' => 'Initial inventory setup',
            'notes' => 'Stock added during system initialization',
            'created_by' => $user?->id,
            'created_at' => now()->subDays(rand(90, 180)),
        ]);
    }

    /**
     * Get random staff member for the tenant
     */
    protected function getRandomStaff(int $tenantId): ?User
    {
        $users = User::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get();

        return $users->isNotEmpty() ? $users->random() : null;
    }

    /**
     * Generate reference number for stock movement
     */
    protected function generateReferenceNumber(): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -6));

        return "INIT-{$date}-{$random}";
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
