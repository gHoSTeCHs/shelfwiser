<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
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
            [
                'name' => 'Repairs & Maintenance',
                'slug' => 'repairs-maintenance',
                'description' => 'General repair and maintenance services',
                'icon' => 'wrench',
                'sort_order' => 1,
            ],
            [
                'name' => 'Tailoring & Alterations',
                'slug' => 'tailoring-alterations',
                'description' => 'Custom tailoring and clothing alteration services',
                'icon' => 'scissors',
                'sort_order' => 2,
            ],
            [
                'name' => 'Printing & Design',
                'slug' => 'printing-design',
                'description' => 'Printing, design, and branding services',
                'icon' => 'printer',
                'sort_order' => 3,
            ],
            [
                'name' => 'Beauty & Grooming',
                'slug' => 'beauty-grooming',
                'description' => 'Hair, beauty, and personal grooming services',
                'icon' => 'sparkles',
                'sort_order' => 4,
            ],
            [
                'name' => 'Consulting & Professional',
                'slug' => 'consulting-professional',
                'description' => 'Professional consulting and advisory services',
                'icon' => 'briefcase',
                'sort_order' => 5,
            ],
            [
                'name' => 'Installation & Setup',
                'slug' => 'installation-setup',
                'description' => 'Installation and setup services for equipment and systems',
                'icon' => 'cog',
                'sort_order' => 6,
            ],
            [
                'name' => 'Cleaning Services',
                'slug' => 'cleaning-services',
                'description' => 'Professional cleaning and janitorial services',
                'icon' => 'spray-can',
                'sort_order' => 7,
            ],
            [
                'name' => 'Photography & Videography',
                'slug' => 'photography-videography',
                'description' => 'Photography, videography, and multimedia services',
                'icon' => 'camera',
                'sort_order' => 8,
            ],
        ];

        foreach ($categories as $category) {
            ServiceCategory::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'slug' => $category['slug'],
                ],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'icon' => $category['icon'],
                    'sort_order' => $category['sort_order'],
                    'is_active' => true,
                ]
            );
        }
    }
}
