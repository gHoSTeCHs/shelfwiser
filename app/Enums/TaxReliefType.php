<?php

namespace App\Enums;

enum TaxReliefType: string
{
    case FIXED = 'fixed';
    case PERCENTAGE = 'percentage';
    case CAPPED_PERCENTAGE = 'capped_percentage';

    public function label(): string
    {
        return match($this) {
            self::FIXED => 'Fixed Amount',
            self::PERCENTAGE => 'Percentage of Gross',
            self::CAPPED_PERCENTAGE => 'Capped Percentage',
        };
    }

    public function description(): string
    {
        return match($this) {
            self::FIXED => 'A fixed monetary amount is deducted as relief',
            self::PERCENTAGE => 'A percentage of gross income is deducted as relief',
            self::CAPPED_PERCENTAGE => 'A percentage of gross income up to a maximum cap',
        };
    }

    public static function options(): array
    {
        return collect(self::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->all();
    }
}
