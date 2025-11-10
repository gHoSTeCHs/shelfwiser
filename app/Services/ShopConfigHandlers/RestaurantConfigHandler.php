<?php

namespace App\Services\ShopConfigHandlers;

use Illuminate\Support\Facades\Validator;

class RestaurantConfigHandler implements \App\Contracts\ShopConfigHandler
{
    public function validate(array $config): bool
    {
        return Validator::make($config, [
            'table_count' => 'required|integer|min:1|max:100',
            'kitchen_printer_ip' => 'required|ip',
            'delivery_radius_miles' => 'nullable|numeric|min:0|max:50',
            'reservation_system' => 'required|in:opentable,resy,internal,none',
            'menu_sections' => 'array',
            'menu_sections.*' => 'string',
            'tip_percentage_default' => 'numeric|min:0|max:1',
            'allergen_tracking' => 'required|boolean',
        ])->passes();
    }

    public function getDefaults(): array
    {
        return [
            'table_count' => 10,
            'kitchen_printer_ip' => '192.168.1.100',
            'delivery_radius_miles' => null,
            'reservation_system' => 'none',
            'menu_sections' => ['appetizers', 'mains', 'desserts'],
            'tip_percentage_default' => 0.20,
            'allergen_tracking' => true,
        ];
    }
}
