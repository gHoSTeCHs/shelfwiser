<?php

namespace Database\Seeders;

use App\Enums\InventoryModel;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();
        $shopTypes = ShopType::whereNull('tenant_id')->get()->keyBy('slug');

        foreach ($tenants as $tenant) {
            $shops = $this->getShopsForTenant($tenant, $shopTypes);

            foreach ($shops as $shopData) {
                Shop::create(array_merge($shopData, [
                    'tenant_id' => $tenant->id,
                ]));
            }
        }
    }

    protected function getShopsForTenant(Tenant $tenant, $shopTypes): array
    {
        $slug = $tenant->slug;

        if ($slug === 'sunshine-retail') {
            return [
                [
                    'shop_type_id' => $shopTypes['general_retail']->id,
                    'slug' => 'sunshine-lagos-island',
                    'name' => 'Sunshine Electronics - Lagos Island',
                    'address' => '123 Marina Street',
                    'city' => 'Lagos',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-802-111-0001',
                    'email' => 'island@sunshine-retail.com',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['food_grocery']->id,
                    'slug' => 'sunshine-ikeja',
                    'name' => 'Sunshine Mart - Ikeja',
                    'address' => '45 Allen Avenue',
                    'city' => 'Ikeja',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-802-111-0002',
                    'email' => 'ikeja@sunshine-retail.com',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::HYBRID,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['fashion_textiles']->id,
                    'slug' => 'sunshine-vi',
                    'name' => 'Sunshine Fashion - Victoria Island',
                    'address' => '88 Ademola Adetokunbo',
                    'city' => 'Victoria Island',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-802-111-0003',
                    'email' => 'vi@sunshine-retail.com',
                    'allow_retail_sales' => false,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['pharmacy_health']->id,
                    'slug' => 'sunshine-lekki',
                    'name' => 'Sunshine Pharmacy - Lekki',
                    'address' => '12 Admiralty Way',
                    'city' => 'Lekki',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-802-111-0004',
                    'email' => 'lekki@sunshine-retail.com',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
            ];
        }

        if ($slug === 'fresh-mart') {
            return [
                [
                    'shop_type_id' => $shopTypes['food_grocery']->id,
                    'slug' => 'freshmart-ikeja',
                    'name' => 'Fresh Mart Supermarket - Ikeja',
                    'address' => '45 Allen Avenue',
                    'city' => 'Ikeja',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-803-222-0001',
                    'email' => 'ikeja@freshmart.ng',
                    'allow_retail_sales' => false,
                    'inventory_model' => InventoryModel::HYBRID,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['food_grocery']->id,
                    'slug' => 'freshmart-surulere',
                    'name' => 'Fresh Mart Express - Surulere',
                    'address' => '78 Adeniran Ogunsanya',
                    'city' => 'Surulere',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-803-222-0002',
                    'email' => 'surulere@freshmart.ng',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['wholesale_trading']->id,
                    'slug' => 'freshmart-warehouse',
                    'name' => 'Fresh Mart Wholesale Center',
                    'address' => '23 Apapa-Oshodi Expressway',
                    'city' => 'Apapa',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-803-222-0003',
                    'email' => 'warehouse@freshmart.ng',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::WHOLESALE_ONLY,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['restaurant_food_service']->id,
                    'slug' => 'freshmart-cafe',
                    'name' => 'Fresh Mart Cafe - Ikoyi',
                    'address' => '15 Kingsway Road',
                    'city' => 'Ikoyi',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-803-222-0004',
                    'email' => 'cafe@freshmart.ng',
                    'allow_retail_sales' => false,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['agriculture_produce']->id,
                    'slug' => 'freshmart-produce',
                    'name' => 'Fresh Mart Produce Market',
                    'address' => '56 Mile 2',
                    'city' => 'Amuwo-Odofin',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-803-222-0005',
                    'email' => 'produce@freshmart.ng',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::HYBRID,
                    'config' => [],
                    'is_active' => true,
                ],
            ];
        }

        if ($slug === 'quickstop') {
            return [
                [
                    'shop_type_id' => $shopTypes['food_grocery']->id,
                    'slug' => 'quickstop-ikoyi',
                    'name' => 'QuickStop - Ikoyi',
                    'address' => '78 Awolowo Road',
                    'city' => 'Ikoyi',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-805-333-0001',
                    'email' => 'ikoyi@quickstop.com.ng',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['food_grocery']->id,
                    'slug' => 'quickstop-lekki-phase1',
                    'name' => 'QuickStop - Lekki Phase 1',
                    'address' => '34 Admiralty Way',
                    'city' => 'Lekki',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-805-333-0002',
                    'email' => 'lekki1@quickstop.com.ng',
                    'allow_retail_sales' => false,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
                [
                    'shop_type_id' => $shopTypes['food_grocery']->id,
                    'slug' => 'quickstop-vi',
                    'name' => 'QuickStop - Victoria Island',
                    'address' => '12 Adeola Odeku',
                    'city' => 'Victoria Island',
                    'state' => 'Lagos',
                    'country' => 'Nigeria',
                    'phone' => '+234-805-333-0003',
                    'email' => 'vi@quickstop.com.ng',
                    'allow_retail_sales' => true,
                    'inventory_model' => InventoryModel::SIMPLE_RETAIL,
                    'config' => [],
                    'is_active' => true,
                ],
            ];
        }

        return [];
    }
}
