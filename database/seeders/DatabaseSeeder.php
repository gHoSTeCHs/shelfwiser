<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // System/Configuration
            ShopTypeSeeder::class,
            ProductTypeSeeder::class,

            // Tax System
            TaxJurisdictionSeeder::class,
            TaxBracketSeeder::class,
            CorporateTaxRateSeeder::class,
            TaxReliefSeeder::class,

            // Core Multi-Tenancy
            TenantSeeder::class,
            UserSeeder::class,
            ShopSeeder::class,
            ShopUserSeeder::class,

            // Product System
            ProductCategorySeeder::class,
            ProductSeeder::class,
            ProductPackagingTypeSeeder::class,
            InventoryLocationSeeder::class,

            // Service System
            ServiceCategorySeeder::class,
            ServiceSeeder::class,

            // E-commerce
            CustomerSeeder::class,

            // Operations
            OrderSeeder::class,
            StockMovementSeeder::class,

            // Supplier/Procurement System
            SupplierProfileSeeder::class,
            SupplierCatalogSeeder::class,
            SupplierConnectionSeeder::class,
            PurchaseOrderSeeder::class,
        ]);
    }
}
