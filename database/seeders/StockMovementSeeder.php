<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\InventoryLocation;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    public function run(): void
    {
        $inventoryLocations = InventoryLocation::with([
            'productVariant.packagingTypes',
            'productVariant.product.shop.tenant'
        ])->get();

        foreach ($inventoryLocations as $location) {
            $this->createMovementsForLocation($location);
        }
    }

    protected function createMovementsForLocation(InventoryLocation $location): void
    {
        $this->createPurchaseMovement($location);

        $saleCount = rand(3, 8);
        for ($i = 0; $i < $saleCount; $i++) {
            $this->createSaleMovement($location);
        }

        if (rand(1, 100) <= 30) {
            $this->createAdjustmentMovement($location);
        }

        if (rand(1, 100) <= 10) {
            $this->createDamageOrLossMovement($location);
        }
    }

    protected function createPurchaseMovement(InventoryLocation $location): void
    {
        $variant = $location->productVariant;
        $packaging = $variant->packagingTypes()->where('is_base_unit', false)->first()
            ?? $variant->packagingTypes()->first();

        if (!$packaging) {
            return;
        }

        $purchaseQuantity = $location->quantity + rand(50, 200);
        $packageQuantity = (int) ceil($purchaseQuantity / $packaging->units_per_package);

        $user = $this->getRandomStaff($variant->product->shop->tenant_id);

        StockMovement::create([
            'tenant_id' => $variant->product->shop->tenant_id,
            'product_variant_id' => $variant->id,
            'product_packaging_type_id' => $packaging->id,
            'from_location_id' => null,
            'to_location_id' => $location->id,
            'type' => StockMovementType::PURCHASE,
            'quantity' => $purchaseQuantity,
            'package_quantity' => $packageQuantity,
            'cost_per_package' => (float) $packaging->cost_price,
            'cost_per_base_unit' => (float) $variant->cost_price,
            'quantity_before' => 0,
            'quantity_after' => $purchaseQuantity,
            'reference_number' => $this->generateReferenceNumber('PO'),
            'reason' => 'Initial purchase from supplier',
            'notes' => null,
            'created_by' => $user?->id,
            'created_at' => now()->subDays(rand(60, 120)),
        ]);
    }

    protected function createSaleMovement(InventoryLocation $location): void
    {
        $variant = $location->productVariant;
        $packaging = $variant->packagingTypes()->first();

        if (!$packaging) {
            return;
        }

        $currentQty = $location->quantity;
        if ($currentQty <= 0) {
            return;
        }

        $maxSale = min($currentQty, (int) ($currentQty * 0.2));
        if ($maxSale <= 0) {
            return;
        }

        $saleQuantity = rand(1, $maxSale);
        $packageQuantity = (int) ceil($saleQuantity / $packaging->units_per_package);

        $user = $this->getRandomStaff($variant->product->shop->tenant_id);

        StockMovement::create([
            'tenant_id' => $variant->product->shop->tenant_id,
            'product_variant_id' => $variant->id,
            'product_packaging_type_id' => $packaging->id,
            'from_location_id' => $location->id,
            'to_location_id' => null,
            'type' => StockMovementType::SALE,
            'quantity' => -$saleQuantity,
            'package_quantity' => $packageQuantity,
            'cost_per_package' => null,
            'cost_per_base_unit' => null,
            'quantity_before' => $currentQty,
            'quantity_after' => $currentQty - $saleQuantity,
            'reference_number' => $this->generateReferenceNumber('SO'),
            'reason' => 'Customer sale',
            'notes' => null,
            'created_by' => $user?->id,
            'created_at' => now()->subDays(rand(1, 60)),
        ]);
    }

    protected function createAdjustmentMovement(InventoryLocation $location): void
    {
        $variant = $location->productVariant;
        $packaging = $variant->packagingTypes()->where('is_base_unit', true)->first()
            ?? $variant->packagingTypes()->first();

        if (!$packaging) {
            return;
        }

        $isIncrease = rand(0, 1);
        $type = $isIncrease ? StockMovementType::ADJUSTMENT_IN : StockMovementType::ADJUSTMENT_OUT;

        $currentQty = $location->quantity;
        $adjustmentQty = rand(1, min(20, max(1, (int) ($currentQty * 0.05))));

        if (!$isIncrease) {
            $adjustmentQty = min($adjustmentQty, $currentQty);
            if ($adjustmentQty <= 0) {
                return;
            }
            $adjustmentQty = -$adjustmentQty;
        }

        $user = $this->getRandomStaff($variant->product->shop->tenant_id);

        StockMovement::create([
            'tenant_id' => $variant->product->shop->tenant_id,
            'product_variant_id' => $variant->id,
            'product_packaging_type_id' => $packaging->id,
            'from_location_id' => $isIncrease ? null : $location->id,
            'to_location_id' => $isIncrease ? $location->id : null,
            'type' => $type,
            'quantity' => $adjustmentQty,
            'package_quantity' => abs((int) ceil($adjustmentQty / $packaging->units_per_package)),
            'cost_per_package' => $isIncrease ? (float) $packaging->cost_price : null,
            'cost_per_base_unit' => $isIncrease ? (float) $variant->cost_price : null,
            'quantity_before' => $currentQty,
            'quantity_after' => $currentQty + $adjustmentQty,
            'reference_number' => $this->generateReferenceNumber('ADJ'),
            'reason' => $isIncrease ? 'Stock count correction - found extra units' : 'Stock count correction - missing units',
            'notes' => 'Inventory adjustment after physical count',
            'created_by' => $user?->id,
            'created_at' => now()->subDays(rand(5, 45)),
        ]);
    }

    protected function createDamageOrLossMovement(InventoryLocation $location): void
    {
        $variant = $location->productVariant;
        $packaging = $variant->packagingTypes()->where('is_base_unit', true)->first()
            ?? $variant->packagingTypes()->first();

        if (!$packaging) {
            return;
        }

        $currentQty = $location->quantity;
        if ($currentQty <= 0) {
            return;
        }

        $type = rand(0, 1) ? StockMovementType::DAMAGE : StockMovementType::LOSS;
        $quantity = rand(1, min(10, max(1, (int) ($currentQty * 0.03))));

        if ($quantity > $currentQty) {
            $quantity = $currentQty;
        }

        $user = $this->getRandomStaff($variant->product->shop->tenant_id);

        $reason = match ($type) {
            StockMovementType::DAMAGE => collect([
                'Product damaged during handling',
                'Packaging defect found',
                'Expired product',
                'Water damage',
            ])->random(),
            StockMovementType::LOSS => collect([
                'Inventory discrepancy - suspected theft',
                'Product missing after stock count',
                'Unaccounted loss',
            ])->random(),
            default => 'Unknown',
        };

        StockMovement::create([
            'tenant_id' => $variant->product->shop->tenant_id,
            'product_variant_id' => $variant->id,
            'product_packaging_type_id' => $packaging->id,
            'from_location_id' => $location->id,
            'to_location_id' => null,
            'type' => $type,
            'quantity' => -$quantity,
            'package_quantity' => (int) ceil($quantity / $packaging->units_per_package),
            'cost_per_package' => null,
            'cost_per_base_unit' => null,
            'quantity_before' => $currentQty,
            'quantity_after' => $currentQty - $quantity,
            'reference_number' => $this->generateReferenceNumber($type === StockMovementType::DAMAGE ? 'DMG' : 'LOSS'),
            'reason' => $reason,
            'notes' => null,
            'created_by' => $user?->id,
            'created_at' => now()->subDays(rand(10, 50)),
        ]);
    }

    protected function getRandomStaff(int $tenantId): ?User
    {
        $users = User::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get();

        return $users->isNotEmpty() ? $users->random() : null;
    }

    protected function generateReferenceNumber(string $prefix): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -6));

        return "{$prefix}-{$date}-{$random}";
    }
}
