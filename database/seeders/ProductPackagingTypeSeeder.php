<?php

namespace Database\Seeders;

use App\Enums\InventoryModel;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class ProductPackagingTypeSeeder extends Seeder
{
    public function run(): void
    {
        $shops = Shop::with(['products.variants'])->get();

        foreach ($shops as $shop) {
            foreach ($shop->products as $product) {
                foreach ($product->variants as $variant) {
                    $this->createPackagingTypesForVariant($variant, $shop->inventory_model);
                }
            }
        }
    }

    protected function createPackagingTypesForVariant(ProductVariant $variant, InventoryModel $inventoryModel): void
    {
        match ($inventoryModel) {
            InventoryModel::SIMPLE_RETAIL => $this->createSimpleRetailPackaging($variant),
            InventoryModel::WHOLESALE_ONLY => $this->createWholesalePackaging($variant),
            InventoryModel::HYBRID => $this->createHybridPackaging($variant),
        };
    }

    protected function createSimpleRetailPackaging(ProductVariant $variant): void
    {
        ProductPackagingType::create([
            'product_variant_id' => $variant->id,
            'name' => 'individual',
            'display_name' => $this->getIndividualDisplayName($variant),
            'units_per_package' => 1,
            'is_sealed_package' => false,
            'price' => $variant->price,
            'cost_price' => $variant->cost_price,
            'is_base_unit' => true,
            'can_break_down' => false,
            'breaks_into_packaging_type_id' => null,
            'min_order_quantity' => 1,
            'display_order' => 1,
            'is_active' => true,
        ]);
    }

    protected function createWholesalePackaging(ProductVariant $variant): void
    {
        $unitsPerCarton = $this->getUnitsPerCarton($variant);
        $unitsPerPack = $this->getUnitsPerPack($variant);

        $individual = ProductPackagingType::create([
            'product_variant_id' => $variant->id,
            'name' => 'individual',
            'display_name' => $this->getIndividualDisplayName($variant),
            'units_per_package' => 1,
            'is_sealed_package' => false,
            'price' => $variant->price,
            'cost_price' => $variant->cost_price,
            'is_base_unit' => true,
            'can_break_down' => false,
            'breaks_into_packaging_type_id' => null,
            'min_order_quantity' => $unitsPerPack,
            'display_order' => 3,
            'is_active' => true,
        ]);

        $packPrice = $this->calculateBulkPrice($variant->price, $unitsPerPack, 0.05);
        $packCost = $this->calculateBulkPrice($variant->cost_price, $unitsPerPack, 0.03);

        $pack = ProductPackagingType::create([
            'product_variant_id' => $variant->id,
            'name' => 'pack',
            'display_name' => "Pack of {$unitsPerPack}",
            'units_per_package' => $unitsPerPack,
            'is_sealed_package' => true,
            'price' => $packPrice,
            'cost_price' => $packCost,
            'is_base_unit' => false,
            'can_break_down' => true,
            'breaks_into_packaging_type_id' => $individual->id,
            'min_order_quantity' => 1,
            'display_order' => 2,
            'is_active' => true,
        ]);

        $cartonPrice = $this->calculateBulkPrice($variant->price, $unitsPerCarton, 0.10);
        $cartonCost = $this->calculateBulkPrice($variant->cost_price, $unitsPerCarton, 0.05);

        ProductPackagingType::create([
            'product_variant_id' => $variant->id,
            'name' => 'carton',
            'display_name' => "Carton of {$unitsPerCarton}",
            'units_per_package' => $unitsPerCarton,
            'is_sealed_package' => true,
            'price' => $cartonPrice,
            'cost_price' => $cartonCost,
            'is_base_unit' => false,
            'can_break_down' => true,
            'breaks_into_packaging_type_id' => $pack->id,
            'min_order_quantity' => 1,
            'display_order' => 1,
            'is_active' => true,
        ]);
    }

    protected function createHybridPackaging(ProductVariant $variant): void
    {
        $unitsPerCarton = $this->getUnitsPerCarton($variant);
        $unitsPerPack = $this->getUnitsPerPack($variant);

        $individual = ProductPackagingType::create([
            'product_variant_id' => $variant->id,
            'name' => 'individual',
            'display_name' => $this->getIndividualDisplayName($variant),
            'units_per_package' => 1,
            'is_sealed_package' => false,
            'price' => $variant->price,
            'cost_price' => $variant->cost_price,
            'is_base_unit' => true,
            'can_break_down' => false,
            'breaks_into_packaging_type_id' => null,
            'min_order_quantity' => 1,
            'display_order' => 3,
            'is_active' => true,
        ]);

        $packPrice = $this->calculateBulkPrice($variant->price, $unitsPerPack, 0.08);
        $packCost = $this->calculateBulkPrice($variant->cost_price, $unitsPerPack, 0.04);

        $pack = ProductPackagingType::create([
            'product_variant_id' => $variant->id,
            'name' => 'pack',
            'display_name' => "Pack of {$unitsPerPack}",
            'units_per_package' => $unitsPerPack,
            'is_sealed_package' => true,
            'price' => $packPrice,
            'cost_price' => $packCost,
            'is_base_unit' => false,
            'can_break_down' => true,
            'breaks_into_packaging_type_id' => $individual->id,
            'min_order_quantity' => 1,
            'display_order' => 2,
            'is_active' => true,
        ]);

        $cartonPrice = $this->calculateBulkPrice($variant->price, $unitsPerCarton, 0.15);
        $cartonCost = $this->calculateBulkPrice($variant->cost_price, $unitsPerCarton, 0.08);

        ProductPackagingType::create([
            'product_variant_id' => $variant->id,
            'name' => 'carton',
            'display_name' => "Carton of {$unitsPerCarton}",
            'units_per_package' => $unitsPerCarton,
            'is_sealed_package' => true,
            'price' => $cartonPrice,
            'cost_price' => $cartonCost,
            'is_base_unit' => false,
            'can_break_down' => true,
            'breaks_into_packaging_type_id' => $pack->id,
            'min_order_quantity' => 1,
            'display_order' => 1,
            'is_active' => true,
        ]);
    }

    protected function getIndividualDisplayName(ProductVariant $variant): string
    {
        return match ($variant->base_unit_name) {
            'bottle' => 'Single Bottle',
            'pack' => 'Single Pack',
            'tin' => 'Single Tin',
            'bag' => 'Single Bag',
            'pair' => 'Single Pair',
            'loaf' => 'Single Loaf',
            'crate' => 'Single Crate',
            'bar' => 'Single Bar',
            default => 'Individual Unit',
        };
    }

    protected function getUnitsPerPack(ProductVariant $variant): int
    {
        $basePrice = (float) $variant->price;

        if ($basePrice >= 100000) {
            return 2;
        }

        if ($basePrice >= 10000) {
            return 4;
        }

        if ($basePrice >= 1000) {
            return 6;
        }

        if ($basePrice >= 500) {
            return 12;
        }

        return 24;
    }

    protected function getUnitsPerCarton(ProductVariant $variant): int
    {
        return $this->getUnitsPerPack($variant) * 4;
    }

    protected function calculateBulkPrice(float $unitPrice, int $quantity, float $discountPercentage): float
    {
        $totalPrice = $unitPrice * $quantity;
        $discount = $totalPrice * $discountPercentage;

        return round($totalPrice - $discount, 2);
    }
}
