<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->createCategoriesForTenant($tenant);
        }
    }

    protected function createCategoriesForTenant($tenant): void
    {
        $categories = [
            ['name' => 'Electronics', 'slug' => 'electronics'],
            ['name' => 'Food & Beverages', 'slug' => 'food-beverages'],
            ['name' => 'Personal Care', 'slug' => 'personal-care'],
            ['name' => 'Home & Kitchen', 'slug' => 'home-kitchen'],
            ['name' => 'Clothing & Fashion', 'slug' => 'clothing-fashion'],
            ['name' => 'Health & Wellness', 'slug' => 'health-wellness'],
            ['name' => 'Groceries', 'slug' => 'groceries'],
            ['name' => 'Snacks & Confectionery', 'slug' => 'snacks-confectionery'],
        ];

        foreach ($categories as $category) {
            ProductCategory::create(array_merge($category, [
                'tenant_id' => $tenant->id,
                'is_active' => true,
            ]));
        }
    }
}
