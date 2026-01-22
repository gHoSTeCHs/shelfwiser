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
            ['name' => 'Electronics', 'slug' => 'electronics', 'description' => 'Discover the latest in technology with high-quality electronic devices designed to make life easier, faster, and more enjoyable. From smartphones and accessories to home appliances and gadgets, find innovative products built for performance and reliability.'],
            ['name' => 'Food & Beverages', 'slug' => 'food-beverages', 'description' => 'A wide selection of fresh, tasty, and nourishing foods and drinks for every occasion. From pantry staples to ready-to-eat meals and refreshing beverages, enjoy products that bring convenience and flavor to your daily routine.'],
            ['name' => 'Personal Care', 'slug' => 'personal-care', 'description' => 'Everything you need to look and feel your best. Explore skincare, haircare, grooming, and hygiene essentials made to support daily wellness and enhance your personal routine.'],
            ['name' => 'Home & Kitchen', 'slug' => 'home-kitchen', 'description' => 'Equip your home with essential tools, décor, and appliances that enhance comfort and efficiency. Discover items that make cooking, cleaning, and living more enjoyable.'],
            ['name' => 'Clothing & Fashion', 'slug' => 'clothing-fashion', 'description' => 'Stay stylish with trendy apparel and accessories for men, women, and children. From casual wear to statement pieces, find outfits that express your personality and elevate your wardrobe.'],
            ['name' => 'Health & Wellness', 'slug' => 'health-wellness', 'description' => 'Products designed to support a healthy lifestyle, boost immunity, and enhance overall well-being. From supplements and fitness essentials to health monitoring devices, prioritize your wellbeing with trusted items.'],
            ['name' => 'Groceries', 'slug' => 'groceries', 'description' => 'Stock up on everyday essentials, including pantry staples, fresh produce, packaged foods, and household must-haves—everything needed to keep your home running smoothly.'],
            ['name' => 'Snacks & Confectionery', 'slug' => 'snacks-confectionery', 'description' => 'Indulge in delicious treats—from chips, biscuits, nuts, and chocolates to sweets and baked goodies. Perfect for cravings, quick bites, and sharing moments.'],
        ];

        foreach ($categories as $category) {
            ProductCategory::create(array_merge($category, [
                'tenant_id' => $tenant->id,
                'is_active' => true,
            ]));
        }
    }
}
