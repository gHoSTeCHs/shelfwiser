<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use App\Models\ProductTemplate;
use App\Models\ProductType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // First, create system-level categories (tenant_id = null)
        $this->createSystemCategories();

        // Get product types
        $foodBeverage = ProductType::where('slug', 'food_beverage')->first();
        $cosmeticsBeauty = ProductType::where('slug', 'cosmetics_beauty')->first();
        $pharmaceutical = ProductType::where('slug', 'pharmaceutical')->first();

        // Get system categories
        $beverages = ProductCategory::whereNull('tenant_id')->where('slug', 'beverages')->first();
        $dairy = ProductCategory::whereNull('tenant_id')->where('slug', 'dairy-products')->first();
        $noodles = ProductCategory::whereNull('tenant_id')->where('slug', 'noodles-pasta')->first();
        $snacks = ProductCategory::whereNull('tenant_id')->where('slug', 'snacks-confectionery')->first();
        $personalCare = ProductCategory::whereNull('tenant_id')->where('slug', 'personal-care')->first();
        $cleaning = ProductCategory::whereNull('tenant_id')->where('slug', 'cleaning-supplies')->first();

        $templates = [
            // Dairy Products
            [
                'name' => 'Peak Milk',
                'description' => 'Peak Evaporated Milk - The preferred milk brand for Nigerian households',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => $dairy?->id,
                'custom_attributes' => [
                    'brand' => 'Peak',
                    'manufacturer' => 'FrieslandCampina WAMCO',
                    'halal_certified' => true,
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Small (150g)',
                            'attributes' => ['size' => '150g'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (48 pcs)', 'units_per_package' => 48, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Medium (170g)',
                            'attributes' => ['size' => '170g'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (48 pcs)', 'units_per_package' => 48, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Large (400g)',
                            'attributes' => ['size' => '400g'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (24 pcs)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Energy Drinks
            [
                'name' => 'Fearless Energy Drink',
                'description' => 'Fearless Energy Drink - Popular energy drink in Nigeria',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => $beverages?->id,
                'custom_attributes' => [
                    'brand' => 'Fearless',
                    'manufacturer' => 'Rite Foods Limited',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Classic (500ml)',
                            'attributes' => ['flavor' => 'Classic', 'size' => '500ml'],
                            'packaging_types' => [
                                ['name' => 'can', 'display_name' => 'Can', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'pack', 'display_name' => 'Pack (24 cans)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Red Berry (500ml)',
                            'attributes' => ['flavor' => 'Red Berry', 'size' => '500ml'],
                            'packaging_types' => [
                                ['name' => 'can', 'display_name' => 'Can', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'pack', 'display_name' => 'Pack (24 cans)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Noodles
            [
                'name' => 'Indomie Instant Noodles',
                'description' => 'Indomie - Nigeria\'s favorite instant noodles',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => $noodles?->id,
                'custom_attributes' => [
                    'brand' => 'Indomie',
                    'manufacturer' => 'De United Foods Industries',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Chicken Flavor (70g)',
                            'attributes' => ['flavor' => 'Chicken', 'size' => '70g'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (40 pcs)', 'units_per_package' => 40, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Onion Chicken (70g)',
                            'attributes' => ['flavor' => 'Onion Chicken', 'size' => '70g'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (40 pcs)', 'units_per_package' => 40, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Pepper Chicken (70g)',
                            'attributes' => ['flavor' => 'Pepper Chicken', 'size' => '70g'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (40 pcs)', 'units_per_package' => 40, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Super Pack (120g)',
                            'attributes' => ['flavor' => 'Chicken', 'size' => '120g'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (20 pcs)', 'units_per_package' => 20, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Soft Drinks
            [
                'name' => 'Coca-Cola',
                'description' => 'Coca-Cola - The world\'s favorite soft drink',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => $beverages?->id,
                'custom_attributes' => [
                    'brand' => 'Coca-Cola',
                    'manufacturer' => 'Nigerian Bottling Company',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Small (35cl)',
                            'attributes' => ['size' => '35cl'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'crate', 'display_name' => 'Crate (24 bottles)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Medium (50cl)',
                            'attributes' => ['size' => '50cl'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'pack', 'display_name' => 'Pack (12 bottles)', 'units_per_package' => 12, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Large (1L)',
                            'attributes' => ['size' => '1L'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'pack', 'display_name' => 'Pack (12 bottles)', 'units_per_package' => 12, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Can (33cl)',
                            'attributes' => ['size' => '33cl', 'container' => 'can'],
                            'packaging_types' => [
                                ['name' => 'can', 'display_name' => 'Can', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'pack', 'display_name' => 'Pack (24 cans)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Snacks
            [
                'name' => 'Gala Sausage Roll',
                'description' => 'Gala - Nigeria\'s iconic sausage roll',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => $snacks?->id,
                'custom_attributes' => [
                    'brand' => 'Gala',
                    'manufacturer' => 'UAC Foods',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Classic',
                            'attributes' => ['type' => 'Classic'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (60 pcs)', 'units_per_package' => 60, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Spicy',
                            'attributes' => ['type' => 'Spicy'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Piece', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (60 pcs)', 'units_per_package' => 60, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Personal Care
            [
                'name' => 'Close-Up Toothpaste',
                'description' => 'Close-Up - Fresh breath toothpaste',
                'product_type_id' => $cosmeticsBeauty?->id,
                'category_id' => $personalCare?->id,
                'custom_attributes' => [
                    'brand' => 'Close-Up',
                    'manufacturer' => 'Unilever',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Red Hot (50ml)',
                            'attributes' => ['variant' => 'Red Hot', 'size' => '50ml'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Tube', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (72 pcs)', 'units_per_package' => 72, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Red Hot (120ml)',
                            'attributes' => ['variant' => 'Red Hot', 'size' => '120ml'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Tube', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (48 pcs)', 'units_per_package' => 48, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Menthol Fresh (120ml)',
                            'attributes' => ['variant' => 'Menthol Fresh', 'size' => '120ml'],
                            'packaging_types' => [
                                ['name' => 'piece', 'display_name' => 'Tube', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (48 pcs)', 'units_per_package' => 48, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Cleaning Supplies
            [
                'name' => 'Dettol Antiseptic',
                'description' => 'Dettol - Trusted antiseptic for protection',
                'product_type_id' => $pharmaceutical?->id,
                'category_id' => $cleaning?->id,
                'custom_attributes' => [
                    'brand' => 'Dettol',
                    'manufacturer' => 'Reckitt Benckiser',
                    'drug_classification' => 'otc',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Original (125ml)',
                            'attributes' => ['size' => '125ml'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (24 bottles)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Original (250ml)',
                            'attributes' => ['size' => '250ml'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (12 bottles)', 'units_per_package' => 12, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Original (500ml)',
                            'attributes' => ['size' => '500ml'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (12 bottles)', 'units_per_package' => 12, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Cooking Oil
            [
                'name' => 'Kings Vegetable Oil',
                'description' => 'Kings - Premium vegetable cooking oil',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => ProductCategory::whereNull('tenant_id')->where('slug', 'cooking-essentials')->first()?->id,
                'custom_attributes' => [
                    'brand' => 'Kings',
                    'manufacturer' => 'Grand Cereals Limited',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Small (75cl)',
                            'attributes' => ['size' => '75cl'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (12 bottles)', 'units_per_package' => 12, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Medium (1.5L)',
                            'attributes' => ['size' => '1.5L'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (12 bottles)', 'units_per_package' => 12, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Large (3L)',
                            'attributes' => ['size' => '3L'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'carton', 'display_name' => 'Carton (6 bottles)', 'units_per_package' => 6, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Sugar/Sweeteners
            [
                'name' => 'Dangote Sugar',
                'description' => 'Dangote Sugar - Quality refined sugar',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => ProductCategory::whereNull('tenant_id')->where('slug', 'cooking-essentials')->first()?->id,
                'custom_attributes' => [
                    'brand' => 'Dangote',
                    'manufacturer' => 'Dangote Sugar Refinery',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Small (500g)',
                            'attributes' => ['size' => '500g'],
                            'packaging_types' => [
                                ['name' => 'pack', 'display_name' => 'Pack', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'bag', 'display_name' => 'Bag (20 packs)', 'units_per_package' => 20, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Medium (1kg)',
                            'attributes' => ['size' => '1kg'],
                            'packaging_types' => [
                                ['name' => 'pack', 'display_name' => 'Pack', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'bag', 'display_name' => 'Bag (10 packs)', 'units_per_package' => 10, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Large (50kg)',
                            'attributes' => ['size' => '50kg'],
                            'packaging_types' => [
                                ['name' => 'bag', 'display_name' => 'Bag', 'units_per_package' => 1, 'is_base_unit' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],

            // Malt Drinks
            [
                'name' => 'Malta Guinness',
                'description' => 'Malta Guinness - Rich malt drink',
                'product_type_id' => $foodBeverage?->id,
                'category_id' => $beverages?->id,
                'custom_attributes' => [
                    'brand' => 'Malta Guinness',
                    'manufacturer' => 'Nigerian Breweries',
                ],
                'template_structure' => [
                    'variants' => [
                        [
                            'name' => 'Small (33cl)',
                            'attributes' => ['size' => '33cl'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'crate', 'display_name' => 'Crate (24 bottles)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Large (50cl)',
                            'attributes' => ['size' => '50cl'],
                            'packaging_types' => [
                                ['name' => 'bottle', 'display_name' => 'Bottle', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'pack', 'display_name' => 'Pack (12 bottles)', 'units_per_package' => 12, 'can_break_down' => true],
                            ],
                        ],
                        [
                            'name' => 'Can (33cl)',
                            'attributes' => ['size' => '33cl', 'container' => 'can'],
                            'packaging_types' => [
                                ['name' => 'can', 'display_name' => 'Can', 'units_per_package' => 1, 'is_base_unit' => true],
                                ['name' => 'pack', 'display_name' => 'Pack (24 cans)', 'units_per_package' => 24, 'can_break_down' => true],
                            ],
                        ],
                    ],
                ],
                'has_variants' => true,
                'is_system' => true,
                'is_active' => true,
            ],
        ];

        foreach ($templates as $templateData) {
            if ($templateData['product_type_id'] === null) {
                continue; // Skip if product type not found
            }

            ProductTemplate::query()->firstOrCreate(
                ['slug' => Str::slug($templateData['name']), 'tenant_id' => null],
                $templateData
            );
        }
    }

    /**
     * Create system-level categories that templates can reference
     */
    protected function createSystemCategories(): void
    {
        $categories = [
            ['name' => 'Beverages', 'slug' => 'beverages', 'description' => 'Refresh and energize with a diverse selection of drinks. Choose from soft drinks, juices, water, energy drinks, teas, and more to match every taste and occasion.'],
            ['name' => 'Dairy Products', 'slug' => 'dairy-products', 'description' => 'Fresh and high-quality dairy options including milk, cheese, yogurt, butter, and more. Perfect for cooking, baking, or enjoying on their own.'],
            ['name' => 'Noodles & Pasta', 'slug' => 'noodles-pasta', 'description' => 'Quick, convenient, and satisfying meal options. Explore instant noodles, spaghetti, macaroni, and specialty pasta perfect for fast cooking and delicious recipes.'],
            ['name' => 'Snacks & Confectionery', 'slug' => 'snacks-confectionery', 'description' => 'Indulge in delicious treats—from chips, biscuits, nuts, and chocolates to sweets and baked goodies. Perfect for cravings, quick bites, and sharing moments.'],
            ['name' => 'Personal Care', 'slug' => 'personal-care', 'description' => 'Everything you need to look and feel your best. Explore skincare, haircare, grooming, and hygiene essentials made to support daily wellness and enhance your personal routine.'],
            ['name' => 'Cleaning Supplies', 'slug' => 'cleaning-supplies', 'description' => 'Keep your home spotless with effective cleaning solutions, detergents, disinfectants, and tools. Designed to ensure hygiene, comfort, and a fresh living space.'],
            ['name' => 'Cooking Essentials', 'slug' => 'cooking-essentials', 'description' => 'Everything you need for everyday cooking—from oils, spices, and seasonings to flour, grains, and sauces. Build your perfect pantry with top-quality basics.'],
            ['name' => 'Canned Foods', 'slug' => 'canned-foods', 'description' => 'Convenient and long-lasting meal options including vegetables, soups, beans, fish, and ready-to-eat dishes. Ideal for quick cooking and emergency storage.'],
            ['name' => 'Baby Products', 'slug' => 'baby-products', 'description' => 'Safe, gentle, and trusted items for your little ones. Explore baby food, diapers, skincare, feeding accessories, toys, and more—crafted for comfort and care.'],
            ['name' => 'Health & Wellness', 'slug' => 'health-wellness', 'description' => 'A curated range of products dedicated to improving physical and mental wellbeing. Find supplements, fitness gear, healthy foods, and self-care essentials to support an active lifestyle.'],
        ];

        foreach ($categories as $category) {
            ProductCategory::firstOrCreate(
                ['slug' => $category['slug'], 'tenant_id' => null],
                array_merge($category, ['is_active' => true])
            );
        }
    }
}
