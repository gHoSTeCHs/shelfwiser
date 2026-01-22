<?php

namespace App\Enums;

enum DeductionCalculationType: string
{
    case FIXED = 'fixed';
    case PERCENTAGE = 'percentage';
    case TIERED = 'tiered';
    case FORMULA = 'formula';

    public function label(): string
    {
        return match ($this) {
            self::FIXED => 'Fixed Amount',
            self::PERCENTAGE => 'Percentage',
            self::TIERED => 'Tiered/Progressive',
            self::FORMULA => 'Custom Formula',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::FIXED => 'A fixed amount deducted each period',
            self::PERCENTAGE => 'Calculated as percentage of a base amount',
            self::TIERED => 'Progressive tiers (e.g., PAYE tax bands)',
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
