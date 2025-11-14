<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ShopTypeSeeder::class,
            ProductTypeSeeder::class,
            TenantSeeder::class,
            UserSeeder::class,
            ShopSeeder::class,
            ShopUserSeeder::class,
            ProductCategorySeeder::class,
            ProductSeeder::class,
            ProductPackagingTypeSeeder::class,
            InventoryLocationSeeder::class,
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
