<?php

namespace App\Enums;

enum FundRequestType: string
{
    case REPAIRS = 'repairs';
    case FUEL = 'fuel';
    case SUPPLIES = 'supplies';
    case INVENTORY = 'inventory';
    case UTILITIES = 'utilities';
    case MAINTENANCE = 'maintenance';
    case EQUIPMENT = 'equipment';
    case TRANSPORTATION = 'transportation';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::REPAIRS => 'Repairs',
            self::FUEL => 'Fuel',
            self::SUPPLIES => 'Office Supplies',
            self::INVENTORY => 'Inventory Purchase',
            self::UTILITIES => 'Utilities',
            self::MAINTENANCE => 'Maintenance',
            self::EQUIPMENT => 'Equipment',
            self::TRANSPORTATION => 'Transportation',
            self::OTHER => 'Other',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::REPAIRS => 'Shop or equipment repairs',
            self::FUEL => 'Fuel for vehicles or generators',
            self::SUPPLIES => 'Office supplies and stationery',
            self::INVENTORY => 'Emergency inventory purchase',
            self::UTILITIES => 'Electricity, water, or internet bills',
            self::MAINTENANCE => 'Regular maintenance costs',
            self::EQUIPMENT => 'Purchase or rental of equipment',
            self::TRANSPORTATION => 'Transportation or delivery costs',
            self::OTHER => 'Other operational expenses',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::REPAIRS => 'wrench',
            self::FUEL => 'fuel',
            self::SUPPLIES => 'package',
            self::INVENTORY => 'boxes',
            self::UTILITIES => 'zap',
            self::MAINTENANCE => 'tool',
            self::EQUIPMENT => 'laptop',
            self::TRANSPORTATION => 'truck',
            self::OTHER => 'circle-dollar-sign',
        };
    }
}
