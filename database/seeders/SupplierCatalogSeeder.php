<?php

namespace Database\Seeders;

use App\Enums\CatalogVisibility;
use App\Models\Product;
use App\Models\SupplierCatalogItem;
use App\Models\SupplierPricingTier;
use App\Models\SupplierProfile;
use Illuminate\Database\Seeder;

class SupplierCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $supplierProfiles = SupplierProfile::with(['tenant.shops.products'])->get();

        foreach ($supplierProfiles as $profile) {
            $this->createCatalogForSupplier($profile);
        }
    }

    protected function createCatalogForSupplier(SupplierProfile $profile): void
    {
        $products = Product::query()
            ->where('tenant_id', $profile->tenant_id)
            ->with('variants')
            ->get();

        if ($products->isEmpty()) {
            return;
        }

        // Add 60-80% of supplier's products to their catalog
        $catalogSize = (int) ceil($products->count() * (rand(60, 80) / 100));
        $selectedProducts = $products->random(min($catalogSize, $products->count()));

        foreach ($selectedProducts as $product) {
            $this->createCatalogItem($profile, $product);
        }
    }

    protected function createCatalogItem(SupplierProfile $profile, Product $product): void
    {
        $variant = $product->variants->first();

        if (!$variant) {
            return;
        }

        // Wholesale price is typically 70-85% of retail price
        $wholesaleDiscountPercent = rand(70, 85) / 100;
        $baseWholesalePrice = round($variant->price * $wholesaleDiscountPercent, 2);

        $visibility = $this->getRandomVisibility();

        $catalogItem = SupplierCatalogItem::create([
            'supplier_tenant_id' => $profile->tenant_id,
            'product_id' => $product->id,
            'is_available' => rand(1, 100) <= 95, // 95% available
            'base_wholesale_price' => $baseWholesalePrice,
            'min_order_quantity' => $this->determineMinOrderQuantity($variant->base_unit_name),
            'visibility' => $visibility,
            'description' => $this->generateSupplierDescription($product),
        ]);

        // Create volume-based pricing tiers
        $this->createPricingTiers($catalogItem, $baseWholesalePrice);
    }

    protected function createPricingTiers(SupplierCatalogItem $catalogItem, float $basePrice): void
    {
        $tiers = [
            ['min' => 1, 'max' => 9, 'discount' => 0],      // Base price
            ['min' => 10, 'max' => 49, 'discount' => 5],    // 5% discount
            ['min' => 50, 'max' => 99, 'discount' => 10],   // 10% discount
            ['min' => 100, 'max' => null, 'discount' => 15], // 15% discount
        ];

        foreach ($tiers as $tier) {
            $discountedPrice = $basePrice * (1 - ($tier['discount'] / 100));

            SupplierPricingTier::create([
                'catalog_item_id' => $catalogItem->id,
                'connection_id' => null, // General tier, not connection-specific
                'min_quantity' => $tier['min'],
                'max_quantity' => $tier['max'],
                'price' => round($discountedPrice, 2),
            ]);
        }
    }

    protected function getRandomVisibility(): CatalogVisibility
    {
        $weights = [
            CatalogVisibility::PUBLIC->value => 60,              // 60% public
            CatalogVisibility::CONNECTIONS_ONLY->value => 30,    // 30% connections only
            CatalogVisibility::PRIVATE->value => 10,             // 10% private
        ];

        $rand = rand(1, 100);
        $cumulative = 0;

        foreach ($weights as $visibility => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return CatalogVisibility::from($visibility);
            }
        }

        return CatalogVisibility::PUBLIC;
    }

    protected function determineMinOrderQuantity(string $baseUnit): int
    {
        $lowVolumeUnits = ['unit', 'pair', 'set', 'piece'];
        $mediumVolumeUnits = ['pack', 'box', 'tin', 'bottle', 'bar'];
        $highVolumeUnits = ['bag', 'crate', 'case'];

        if (in_array($baseUnit, $lowVolumeUnits)) {
            return rand(1, 5);
        }

        if (in_array($baseUnit, $mediumVolumeUnits)) {
            return rand(5, 20);
        }

        if (in_array($baseUnit, $highVolumeUnits)) {
            return rand(2, 10);
        }

        return rand(1, 10);
    }

    protected function generateSupplierDescription(Product $product): ?string
    {
        $templates = [
            'Bulk wholesale pricing available. Quality guaranteed.',
            'Premium grade. Fast delivery. Minimum order quantities apply.',
            'Direct from manufacturer. Competitive wholesale rates.',
            'In stock and ready to ship. Volume discounts available.',
            'Best wholesale prices. Reliable supply chain.',
            null, // Some items have no description
        ];

        return $templates[array_rand($templates)];
    }
}
