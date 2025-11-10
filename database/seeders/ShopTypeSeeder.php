<?php

namespace Database\Seeders;

use App\Models\ShopType;
use Illuminate\Database\Seeder;

class ShopTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            // PHASE 1: ESSENTIAL SHOP TYPES (Launch Priority)
            [
                'slug' => 'general_retail',
                'label' => 'General Retail',
                'description' => 'General merchandise retail for electronics, hardware, bookstores, cosmetics, stationery, toys, and other non-perishable goods',
                'config_schema' => $this->generalRetailSchema(),
            ],
            [
                'slug' => 'food_grocery',
                'label' => 'Food & Grocery',
                'description' => 'Supermarkets, grocery stores, convenience stores, and market stalls selling food items with expiration tracking',
                'config_schema' => $this->foodGrocerySchema(),
            ],
            [
                'slug' => 'restaurant_food_service',
                'label' => 'Restaurant & Food Service',
                'description' => 'Restaurants, cafes, food trucks, street food vendors, bakeries, and catering services',
                'config_schema' => $this->restaurantSchema(),
            ],
            [
                'slug' => 'fashion_textiles',
                'label' => 'Fashion & Textiles',
                'description' => 'Clothing stores, fabric shops, shoe stores, tailoring businesses, and fashion boutiques',
                'config_schema' => $this->fashionTextilesSchema(),
            ],
            [
                'slug' => 'wholesale_trading',
                'label' => 'Wholesale & Trading',
                'description' => 'Distributors, wholesalers, cash & carry, import/export businesses, and bulk market traders',
                'config_schema' => $this->wholesaleTradingSchema(),
            ],
            [
                'slug' => 'pharmacy_health',
                'label' => 'Pharmacy & Health',
                'description' => 'Licensed pharmacies, drug stores, and medical supply stores with regulatory compliance',
                'config_schema' => $this->pharmacyHealthSchema(),
            ],
            [
                'slug' => 'agriculture_produce',
                'label' => 'Agriculture & Produce',
                'description' => 'Farm produce, agricultural inputs, livestock supplies, seeds, and fertilizers',
                'config_schema' => $this->agricultureProduceSchema(),
            ],

            // PHASE 2: GROWTH SHOP TYPES (Post-Launch)
            [
                'slug' => 'building_construction',
                'label' => 'Building & Construction',
                'description' => 'Hardware stores, construction materials, paint, plumbing, electrical supplies, and cement dealers',
                'config_schema' => $this->buildingConstructionSchema(),
            ],
            [
                'slug' => 'automotive_parts',
                'label' => 'Automotive Parts',
                'description' => 'Auto parts stores, car accessories, motorcycle parts, and spare parts dealers',
                'config_schema' => $this->automotivePartsSchema(),
            ],
            [
                'slug' => 'services_repairs',
                'label' => 'Services & Repairs',
                'description' => 'Salons, barbershops, repair shops, laundry services, and other service-based businesses with consumable inventory',
                'config_schema' => $this->servicesRepairsSchema(),
            ],
        ];

        foreach ($types as $type) {
            ShopType::query()->firstOrCreate(
                ['slug' => $type['slug'], 'tenant_id' => null],
                $type
            );
        }
    }

    private function generalRetailSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'returns_policy_days' => [
                    'type' => 'integer',
                    'title' => 'Returns Policy (Days)',
                    'minimum' => 0,
                    'maximum' => 365,
                    'default' => 30,
                ],
                'warranty_tracking_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Enable Warranty Tracking',
                    'default' => false,
                ],
                'serial_number_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Track Serial Numbers',
                    'default' => false,
                ],
                'loyalty_program_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Enable Loyalty Program',
                    'default' => false,
                ],
                'pos_integration' => [
                    'type' => 'string',
                    'title' => 'POS Integration',
                    'enum' => ['square', 'shopify', 'clover', 'none'],
                    'default' => 'none',
                ],
                'barcode_system' => [
                    'type' => 'string',
                    'title' => 'Barcode System',
                    'enum' => ['ean13', 'upc', 'custom', 'none'],
                    'default' => 'ean13',
                ],
            ],
            'required' => [],
        ];
    }

    private function foodGrocerySchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'expiration_tracking_mandatory' => [
                    'type' => 'boolean',
                    'title' => 'Mandatory Expiration Date Tracking',
                    'default' => true,
                ],
                'cold_storage_available' => [
                    'type' => 'boolean',
                    'title' => 'Cold Storage Available',
                    'default' => false,
                ],
                'storage_zones' => [
                    'type' => 'array',
                    'title' => 'Storage Zones',
                    'items' => [
                        'type' => 'string',
                        'enum' => ['freezer', 'refrigerated', 'room_temp', 'dry_storage'],
                    ],
                    'default' => ['room_temp'],
                ],
                'batch_lot_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Batch/Lot Tracking',
                    'default' => true,
                ],
                'waste_tracking_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Track Waste/Spoilage',
                    'default' => false,
                ],
                'fifo_enforcement' => [
                    'type' => 'boolean',
                    'title' => 'Enforce FIFO (First In, First Out)',
                    'default' => true,
                ],
                'supplier_traceability' => [
                    'type' => 'boolean',
                    'title' => 'Supplier Traceability',
                    'default' => false,
                ],
            ],
            'required' => ['expiration_tracking_mandatory'],
        ];
    }

    private function restaurantSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'table_management_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Enable Table Management',
                    'default' => false,
                ],
                'table_count' => [
                    'type' => 'integer',
                    'title' => 'Number of Tables',
                    'minimum' => 0,
                    'maximum' => 200,
                    'default' => 0,
                ],
                'recipe_management' => [
                    'type' => 'boolean',
                    'title' => 'Enable Recipe Management',
                    'default' => false,
                ],
                'ingredient_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Track Ingredients',
                    'default' => false,
                ],
                'delivery_service_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Delivery Service',
                    'default' => false,
                ],
                'takeaway_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Takeaway Service',
                    'default' => true,
                ],
                'kitchen_display_system' => [
                    'type' => 'boolean',
                    'title' => 'Kitchen Display System',
                    'default' => false,
                ],
                'food_safety_certification_number' => [
                    'type' => 'string',
                    'title' => 'Food Safety Certification Number',
                    'default' => '',
                ],
            ],
            'required' => [],
        ];
    }

    private function fashionTextilesSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'size_system' => [
                    'type' => 'string',
                    'title' => 'Size System',
                    'enum' => ['numeric', 'letter', 'custom', 'shoe_sizes', 'not_applicable'],
                    'default' => 'letter',
                ],
                'color_tracking_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Track Colors as Variants',
                    'default' => true,
                ],
                'material_types_tracked' => [
                    'type' => 'boolean',
                    'title' => 'Track Material Types',
                    'default' => false,
                ],
                'seasonal_collections' => [
                    'type' => 'boolean',
                    'title' => 'Seasonal Collections',
                    'default' => false,
                ],
                'fabric_sold_by_unit' => [
                    'type' => 'string',
                    'title' => 'Fabric Unit of Measure',
                    'enum' => ['meter', 'yard', 'roll', 'piece', 'not_applicable'],
                    'default' => 'meter',
                ],
                'alteration_services' => [
                    'type' => 'boolean',
                    'title' => 'Offer Alteration Services',
                    'default' => false,
                ],
                'bulk_pricing_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Bulk/Wholesale Pricing',
                    'default' => true,
                ],
            ],
            'required' => [],
        ];
    }

    private function wholesaleTradingSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'minimum_order_quantity_default' => [
                    'type' => 'integer',
                    'title' => 'Default Minimum Order Quantity',
                    'minimum' => 1,
                    'default' => 1,
                ],
                'bulk_pricing_tiers' => [
                    'type' => 'integer',
                    'title' => 'Number of Bulk Pricing Tiers',
                    'minimum' => 1,
                    'maximum' => 10,
                    'default' => 3,
                ],
                'credit_terms_days' => [
                    'type' => 'integer',
                    'title' => 'Default Credit Terms (Days)',
                    'minimum' => 0,
                    'maximum' => 180,
                    'default' => 0,
                ],
                'b2b_mode_enabled' => [
                    'type' => 'boolean',
                    'title' => 'B2B Mode (Business to Business)',
                    'default' => true,
                ],
                'multi_warehouse_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Multiple Warehouse Locations',
                    'default' => false,
                ],
                'drop_shipping_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Drop Shipping Enabled',
                    'default' => false,
                ],
                'trade_license_number' => [
                    'type' => 'string',
                    'title' => 'Trade License Number',
                    'default' => '',
                ],
            ],
            'required' => [],
        ];
    }

    private function pharmacyHealthSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'pharmacy_license_number' => [
                    'type' => 'string',
                    'title' => 'Pharmacy License Number',
                    'minLength' => 1,
                ],
                'prescription_tracking_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Prescription Tracking',
                    'default' => true,
                ],
                'controlled_substance_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Controlled Substance Tracking',
                    'default' => true,
                ],
                'batch_lot_mandatory' => [
                    'type' => 'boolean',
                    'title' => 'Mandatory Batch/Lot Numbers',
                    'default' => true,
                ],
                'expiration_tracking_mandatory' => [
                    'type' => 'boolean',
                    'title' => 'Mandatory Expiration Tracking',
                    'default' => true,
                ],
                'insurance_billing_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Insurance Billing',
                    'default' => false,
                ],
                'regulatory_authority' => [
                    'type' => 'string',
                    'title' => 'Regulatory Authority',
                    'enum' => ['nafdac', 'fda', 'ema', 'other'],
                    'default' => 'nafdac',
                ],
                'prescription_upload_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Allow Prescription Upload',
                    'default' => false,
                ],
            ],
            'required' => ['pharmacy_license_number'],
        ];
    }

    private function agricultureProduceSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'seasonal_product_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Track Seasonal Products',
                    'default' => true,
                ],
                'harvest_season' => [
                    'type' => 'array',
                    'title' => 'Harvest Seasons',
                    'items' => [
                        'type' => 'string',
                        'enum' => ['dry', 'wet', 'year_round'],
                    ],
                    'default' => ['year_round'],
                ],
                'perishability_level' => [
                    'type' => 'string',
                    'title' => 'Perishability Level',
                    'enum' => ['high', 'medium', 'low', 'non_perishable'],
                    'default' => 'medium',
                ],
                'organic_certified' => [
                    'type' => 'boolean',
                    'title' => 'Organic Certification',
                    'default' => false,
                ],
                'grade_classification' => [
                    'type' => 'string',
                    'title' => 'Product Grade Classification',
                    'enum' => ['grade_a', 'grade_b', 'grade_c', 'none'],
                    'default' => 'none',
                ],
                'weather_dependent' => [
                    'type' => 'boolean',
                    'title' => 'Weather Dependent Business',
                    'default' => true,
                ],
                'livestock_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Livestock Tracking',
                    'default' => false,
                ],
            ],
            'required' => [],
        ];
    }

    private function buildingConstructionSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'project_based_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Project-Based Inventory Tracking',
                    'default' => false,
                ],
                'bulk_unit_of_measure' => [
                    'type' => 'string',
                    'title' => 'Primary Unit of Measure',
                    'enum' => ['bags', 'tonnes', 'cubic_meters', 'pieces', 'mixed'],
                    'default' => 'pieces',
                ],
                'technical_specs_required' => [
                    'type' => 'boolean',
                    'title' => 'Require Technical Specifications',
                    'default' => true,
                ],
                'delivery_service_mandatory' => [
                    'type' => 'boolean',
                    'title' => 'Delivery Service Mandatory',
                    'default' => false,
                ],
                'minimum_order_value' => [
                    'type' => 'number',
                    'title' => 'Minimum Order Value',
                    'minimum' => 0,
                    'default' => 0,
                ],
                'credit_for_contractors' => [
                    'type' => 'boolean',
                    'title' => 'Credit Terms for Contractors',
                    'default' => false,
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
                'vehicle_compatibility_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Track Vehicle Compatibility',
                    'default' => true,
                ],
                'part_number_system' => [
                    'type' => 'string',
                    'title' => 'Part Number System',
                    'enum' => ['oem', 'aftermarket', 'both'],
                    'default' => 'both',
                ],
                'warranty_tracking_mandatory' => [
                    'type' => 'boolean',
                    'title' => 'Mandatory Warranty Tracking',
                    'default' => true,
                ],
                'core_charge_system' => [
                    'type' => 'boolean',
                    'title' => 'Core Charge System (Rebuilt Parts)',
                    'default' => false,
                ],
                'fitment_guide_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Enable Fitment Guide',
                    'default' => false,
                ],
            ],
            'required' => [],
        ];
    }

    private function servicesRepairsSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'service_catalog_enabled' => [
                    'type' => 'boolean',
                    'title' => 'Service Catalog Enabled',
                    'default' => true,
                ],
                'appointment_booking' => [
                    'type' => 'boolean',
                    'title' => 'Appointment Booking System',
                    'default' => false,
                ],
                'consumables_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Track Consumables (e.g., shampoo, detergent)',
                    'default' => true,
                ],
                'equipment_inventory' => [
                    'type' => 'boolean',
                    'title' => 'Track Equipment Inventory',
                    'default' => false,
                ],
                'staff_commission_tracking' => [
                    'type' => 'boolean',
                    'title' => 'Staff Commission Tracking',
                    'default' => false,
                ],
            ],
            'required' => [],
        ];
    }
}
