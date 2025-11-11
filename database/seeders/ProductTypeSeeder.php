<?php

namespace Database\Seeders;

use App\Models\ProductType;
use Illuminate\Database\Seeder;

class ProductTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'slug' => 'pharmaceutical',
                'label' => 'Pharmaceutical Products',
                'description' => 'Medications, drugs, and medical supplies with batch and expiry tracking',
                'supports_variants' => true,
                'requires_batch_tracking' => true,
                'requires_serial_tracking' => false,
                'config_schema' => $this->pharmaceuticalSchema(),
            ],
            [
                'slug' => 'clothing_apparel',
                'label' => 'Clothing & Apparel',
                'description' => 'Garments, fashion items with multiple colors, sizes, and styles',
                'supports_variants' => true,
                'requires_batch_tracking' => false,
                'requires_serial_tracking' => false,
                'config_schema' => $this->clothingApparelSchema(),
            ],
            [
                'slug' => 'electronics',
                'label' => 'Electronics',
                'description' => 'Electronic devices, gadgets with serial numbers and warranty tracking',
                'supports_variants' => true,
                'requires_batch_tracking' => false,
                'requires_serial_tracking' => true,
                'config_schema' => $this->electronicsSchema(),
            ],
            [
                'slug' => 'food_beverage',
                'label' => 'Food & Beverage',
                'description' => 'Consumable food and drink products with expiration tracking',
                'supports_variants' => true,
                'requires_batch_tracking' => true,
                'requires_serial_tracking' => false,
                'config_schema' => $this->foodBeverageSchema(),
            ],
            [
                'slug' => 'cosmetics_beauty',
                'label' => 'Cosmetics & Beauty',
                'description' => 'Beauty products, makeup, skincare with shades and batch numbers',
                'supports_variants' => true,
                'requires_batch_tracking' => true,
                'requires_serial_tracking' => false,
                'config_schema' => $this->cosmeticsBeautySchema(),
            ],
            [
                'slug' => 'books_media',
                'label' => 'Books & Media',
                'description' => 'Books, magazines, CDs, DVDs with ISBN and format variants',
                'supports_variants' => true,
                'requires_batch_tracking' => false,
                'requires_serial_tracking' => false,
                'config_schema' => $this->booksMediaSchema(),
            ],
            [
                'slug' => 'furniture_home',
                'label' => 'Furniture & Home',
                'description' => 'Furniture, home decor with materials, colors, and dimensions',
                'supports_variants' => true,
                'requires_batch_tracking' => false,
                'requires_serial_tracking' => false,
                'config_schema' => $this->furnitureHomeSchema(),
            ],
            [
                'slug' => 'automotive_parts',
                'label' => 'Automotive Parts',
                'description' => 'Auto parts, accessories with vehicle compatibility tracking',
                'supports_variants' => true,
                'requires_batch_tracking' => false,
                'requires_serial_tracking' => true,
                'config_schema' => $this->automotivePartsSchema(),
            ],
            [
                'slug' => 'agricultural_supplies',
                'label' => 'Agricultural Supplies',
                'description' => 'Seeds, fertilizers, farming supplies with seasonal and grade tracking',
                'supports_variants' => true,
                'requires_batch_tracking' => true,
                'requires_serial_tracking' => false,
                'config_schema' => $this->agriculturalSuppliesSchema(),
            ],
            [
                'slug' => 'building_materials',
                'label' => 'Building Materials',
                'description' => 'Construction materials with technical specifications',
                'supports_variants' => true,
                'requires_batch_tracking' => false,
                'requires_serial_tracking' => false,
                'config_schema' => $this->buildingMaterialsSchema(),
            ],
        ];

        foreach ($types as $type) {
            ProductType::query()->firstOrCreate(
                ['slug' => $type['slug'], 'tenant_id' => null],
                $type
            );
        }
    }

    private function pharmaceuticalSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'drug_classification' => [
                    'type' => 'string',
                    'title' => 'Drug Classification',
                    'enum' => ['prescription', 'otc', 'controlled', 'supplement'],
                ],
                'active_ingredient' => [
                    'type' => 'string',
                    'title' => 'Active Ingredient',
                ],
                'manufacturer' => [
                    'type' => 'string',
                    'title' => 'Manufacturer',
                ],
                'storage_conditions' => [
                    'type' => 'string',
                    'title' => 'Storage Conditions',
                    'enum' => ['room_temp', 'refrigerated', 'frozen', 'controlled'],
                ],
                'regulatory_approval' => [
                    'type' => 'string',
                    'title' => 'Regulatory Approval',
                ],
            ],
            'required' => [],
        ];
    }

    private function clothingApparelSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'gender' => [
                    'type' => 'string',
                    'title' => 'Gender',
                    'enum' => ['men', 'women', 'unisex', 'kids'],
                ],
                'material' => [
                    'type' => 'string',
                    'title' => 'Primary Material',
                ],
                'care_instructions' => [
                    'type' => 'string',
                    'title' => 'Care Instructions',
                ],
                'season' => [
                    'type' => 'string',
                    'title' => 'Season',
                    'enum' => ['spring_summer', 'fall_winter', 'all_season'],
                ],
                'brand' => [
                    'type' => 'string',
                    'title' => 'Brand',
                ],
            ],
            'required' => [],
        ];
    }

    private function electronicsSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'brand' => [
                    'type' => 'string',
                    'title' => 'Brand',
                ],
                'model_number' => [
                    'type' => 'string',
                    'title' => 'Model Number',
                ],
                'warranty_months' => [
                    'type' => 'integer',
                    'title' => 'Warranty Period (Months)',
                    'minimum' => 0,
                    'maximum' => 60,
                ],
                'power_requirements' => [
                    'type' => 'string',
                    'title' => 'Power Requirements',
                ],
                'connectivity' => [
                    'type' => 'array',
                    'title' => 'Connectivity Options',
                    'items' => [
                        'type' => 'string',
                        'enum' => ['wifi', 'bluetooth', 'usb', 'ethernet', 'nfc'],
                    ],
                ],
            ],
            'required' => [],
        ];
    }

    private function foodBeverageSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'ingredients' => [
                    'type' => 'string',
                    'title' => 'Ingredients List',
                ],
                'allergens' => [
                    'type' => 'array',
                    'title' => 'Allergens',
                    'items' => [
                        'type' => 'string',
                        'enum' => ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'fish', 'shellfish'],
                    ],
                ],
                'nutritional_info' => [
                    'type' => 'object',
                    'title' => 'Nutritional Information',
                    'properties' => [
                        'calories' => ['type' => 'number'],
                        'protein' => ['type' => 'number'],
                        'carbs' => ['type' => 'number'],
                        'fat' => ['type' => 'number'],
                    ],
                ],
                'storage_instructions' => [
                    'type' => 'string',
                    'title' => 'Storage Instructions',
                ],
                'halal_certified' => [
                    'type' => 'boolean',
                    'title' => 'Halal Certified',
                ],
            ],
            'required' => [],
        ];
    }

    private function cosmeticsBeautySchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'brand' => [
                    'type' => 'string',
                    'title' => 'Brand',
                ],
                'skin_type' => [
                    'type' => 'string',
                    'title' => 'Suitable for Skin Type',
                    'enum' => ['all', 'dry', 'oily', 'combination', 'sensitive'],
                ],
                'ingredients' => [
                    'type' => 'string',
                    'title' => 'Key Ingredients',
                ],
                'vegan_friendly' => [
                    'type' => 'boolean',
                    'title' => 'Vegan Friendly',
                ],
                'cruelty_free' => [
                    'type' => 'boolean',
                    'title' => 'Cruelty Free',
                ],
            ],
            'required' => [],
        ];
    }

    private function booksMediaSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'author' => [
                    'type' => 'string',
                    'title' => 'Author/Creator',
                ],
                'publisher' => [
                    'type' => 'string',
                    'title' => 'Publisher',
                ],
                'isbn' => [
                    'type' => 'string',
                    'title' => 'ISBN',
                ],
                'publication_year' => [
                    'type' => 'integer',
                    'title' => 'Publication Year',
                    'minimum' => 1900,
                    'maximum' => 2100,
                ],
                'language' => [
                    'type' => 'string',
                    'title' => 'Language',
                ],
                'pages' => [
                    'type' => 'integer',
                    'title' => 'Number of Pages',
                ],
            ],
            'required' => [],
        ];
    }

    private function furnitureHomeSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'dimensions' => [
                    'type' => 'object',
                    'title' => 'Dimensions',
                    'properties' => [
                        'length' => ['type' => 'number', 'title' => 'Length (cm)'],
                        'width' => ['type' => 'number', 'title' => 'Width (cm)'],
                        'height' => ['type' => 'number', 'title' => 'Height (cm)'],
                    ],
                ],
                'material' => [
                    'type' => 'string',
                    'title' => 'Primary Material',
                ],
                'weight_capacity' => [
                    'type' => 'number',
                    'title' => 'Weight Capacity (kg)',
                ],
                'assembly_required' => [
                    'type' => 'boolean',
                    'title' => 'Assembly Required',
                ],
                'style' => [
                    'type' => 'string',
                    'title' => 'Style',
                    'enum' => ['modern', 'classic', 'rustic', 'industrial', 'contemporary'],
                ],
            ],
            'required' => [],
        ];
    }

    private function automotivePartsSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'part_type' => [
                    'type' => 'string',
                    'title' => 'Part Type',
                    'enum' => ['engine', 'transmission', 'brake', 'suspension', 'electrical', 'body'],
                ],
                'oem_number' => [
                    'type' => 'string',
                    'title' => 'OEM Part Number',
                ],
                'compatible_vehicles' => [
                    'type' => 'array',
                    'title' => 'Compatible Vehicles',
                    'items' => ['type' => 'string'],
                ],
                'condition' => [
                    'type' => 'string',
                    'title' => 'Condition',
                    'enum' => ['new', 'refurbished', 'used'],
                ],
                'warranty_months' => [
                    'type' => 'integer',
                    'title' => 'Warranty (Months)',
                    'minimum' => 0,
                    'maximum' => 36,
                ],
            ],
            'required' => [],
        ];
    }

    private function agriculturalSuppliesSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'product_category' => [
                    'type' => 'string',
                    'title' => 'Category',
                    'enum' => ['seeds', 'fertilizer', 'pesticide', 'equipment', 'feed'],
                ],
                'crop_type' => [
                    'type' => 'string',
                    'title' => 'Suitable for Crop Type',
                ],
                'application_method' => [
                    'type' => 'string',
                    'title' => 'Application Method',
                ],
                'organic_certified' => [
                    'type' => 'boolean',
                    'title' => 'Organic Certified',
                ],
                'season' => [
                    'type' => 'string',
                    'title' => 'Growing Season',
                    'enum' => ['dry', 'wet', 'year_round'],
                ],
            ],
            'required' => [],
        ];
    }

    private function buildingMaterialsSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'material_type' => [
                    'type' => 'string',
                    'title' => 'Material Type',
                ],
                'grade' => [
                    'type' => 'string',
                    'title' => 'Grade/Quality',
                ],
                'technical_specs' => [
                    'type' => 'string',
                    'title' => 'Technical Specifications',
                ],
                'coverage_area' => [
                    'type' => 'number',
                    'title' => 'Coverage Area (sqm)',
                ],
                'manufacturer' => [
                    'type' => 'string',
                    'title' => 'Manufacturer',
                ],
            ],
            'required' => [],
        ];
    }
}
