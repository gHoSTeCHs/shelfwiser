<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = [
            [
                'name' => 'Sunshine Retail Group',
                'slug' => 'sunshine-retail',
                'owner_email' => 'owner@sunshine-retail.com',
                'business_type' => 'Retail Chain',
                'phone' => '+234-802-555-0101',
                'subscription_plan' => 'business',
                'max_shops' => 10,
                'max_users' => 50,
                'max_products' => 1000,
                'is_active' => true,
            ],
            [
                'name' => 'Fresh Mart Enterprises',
                'slug' => 'fresh-mart',
                'owner_email' => 'admin@freshmart.ng',
                'business_type' => 'Supermarket',
                'phone' => '+234-803-555-0202',
                'subscription_plan' => 'business',
                'max_shops' => 8,
                'max_users' => 40,
                'max_products' => 800,
                'is_active' => true,
            ],
            [
                'name' => 'QuickStop Convenience Stores',
                'slug' => 'quickstop',
                'owner_email' => 'contact@quickstop.com.ng',
                'business_type' => 'Convenience Store Chain',
                'phone' => '+234-805-555-0303',
                'subscription_plan' => 'trial',
                'max_shops' => 5,
                'max_users' => 20,
                'max_products' => 500,
                'is_active' => true,
            ],
        ];

        foreach ($tenants as $tenantData) {
            Tenant::query()->create($tenantData);
        }
    }
}
