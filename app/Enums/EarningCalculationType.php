<?php

namespace App\Enums;

enum EarningCalculationType: string
{
    case FIXED = 'fixed';
    case PERCENTAGE = 'percentage';
    case HOURLY = 'hourly';
    case FORMULA = 'formula';

    public function label(): string
    {
        return match ($this) {
            self::FIXED => 'Fixed Amount',
            self::PERCENTAGE => 'Percentage',
            self::HOURLY => 'Hourly Rate',
            self::FORMULA => 'Custom Formula',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::FIXED => 'A fixed amount paid each period',
            self::PERCENTAGE => 'Calculated as percentage of base salary',
            self::HOURLY => 'Calculated based on hours worked',
            self::FORMULA => 'Custom calculation formula',
        };
    }

    public static function options(): array
    {
        return array_map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'description' => $case->description(),
        ], self::cases());
    }
}
