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
            [
                'slug' => 'pharmacy',
                'label' => 'Pharmacy',
                'description' => 'Legal prescription drug sales with compliance',
                'config_schema' => $this->pharmacySchema(),
            ],
            [
                'slug' => 'restaurant',
                'label' => 'Restaurant',
                'description' => 'Food service with table management',
                'config_schema' => $this->restaurantSchema(),
            ],
            [
                'slug' => 'retail_boutique',
                'label' => 'Retail Boutique',
                'description' => 'Fashion and lifestyle retail',
                'config_schema' => $this->retailSchema(),
            ],
        ];

        foreach ($types as $type) {
            ShopType::query()->firstOrCreate(
                ['slug' => $type['slug'], 'tenant_id' => null],
                $type
            );
        }
    }


    private function pharmacySchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'dea_number' => ['type' => 'string', 'title' => 'DEA Registration Number'],
                'rx_validation_endpoint' => ['type' => 'string', 'title' => 'Prescription Validation API'],
                'controlled_substance_tracking' => ['type' => 'boolean', 'default' => true],
                'insurance_claim_integration' => [
                    'type' => 'object',
                    'properties' => [
                        'enabled' => ['type' => 'boolean', 'default' => false],
                        'provider' => ['type' => 'string', 'enum' => ['surescripts', 'emdeon']],
                    ],
                ],
            ],
            'required' => ['dea_number', 'controlled_substance_tracking'],
        ];
    }

    private function restaurantSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'table_count' => ['type' => 'integer', 'minimum' => 1],
                'kitchen_printer_ip' => ['type' => 'string', 'format' => 'ipv4'],
                'delivery_radius_miles' => ['type' => 'number', 'minimum' => 0],
                'reservation_system' => ['type' => 'string', 'enum' => ['opentable', 'resy', 'none']],
            ],
            'required' => ['table_count'],
        ];
    }

    private function retailSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'pos_hardware' => ['type' => 'string', 'enum' => ['square', 'shopify', 'none']],
                'returns_policy_days' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 365],
                'loyalty_program' => [
                    'type' => 'object',
                    'properties' => [
                        'enabled' => ['type' => 'boolean', 'default' => false],
                        'points_per_dollar' => ['type' => 'number', 'minimum' => 0],
                    ],
                ],
            ],
            'required' => ['pos_hardware'],
        ];
    }
}
