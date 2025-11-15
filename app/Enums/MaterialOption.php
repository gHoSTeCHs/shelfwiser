<?php

namespace App\Enums;

enum MaterialOption: string
{
    case CUSTOMER_MATERIALS = 'customer_materials';
    case SHOP_MATERIALS = 'shop_materials';
    case NONE = 'none';

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::CUSTOMER_MATERIALS => 'Customer Provides Materials',
            self::SHOP_MATERIALS => 'Shop Provides Materials',
            self::NONE => 'No Materials Required',
        };
    }

    /**
     * Get short description
     */
    public function description(): string
    {
        return match ($this) {
            self::CUSTOMER_MATERIALS => 'Customer brings their own materials/supplies',
            self::SHOP_MATERIALS => 'Shop provides all necessary materials/supplies',
            self::NONE => 'This service does not require additional materials',
        };
    }
}
