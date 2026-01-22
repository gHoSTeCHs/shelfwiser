<?php

namespace App\Enums;

enum TaxReliefType: string
{
    case FIXED = 'fixed';
    case PERCENTAGE = 'percentage';
    case CAPPED_PERCENTAGE = 'capped_percentage';
    case CRA = 'cra';
    case RENT_RELIEF = 'rent_relief';
    case LOW_INCOME_EXEMPTION = 'low_income_exemption';

    public function label(): string
    {
        return match ($this) {
            self::FIXED => 'Fixed Amount',
            self::PERCENTAGE => 'Percentage of Gross',
            self::CAPPED_PERCENTAGE => 'Capped Percentage',
            self::CRA => 'Consolidated Relief Allowance',
            self::RENT_RELIEF => 'Rent Relief',
            self::LOW_INCOME_EXEMPTION => 'Low Income Exemption',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::FIXED => 'A fixed monetary amount is deducted as relief',
            self::PERCENTAGE => 'A percentage of gross income is deducted as relief',
            self::CAPPED_PERCENTAGE => 'A percentage of gross income up to a maximum cap',
            self::CRA => 'PITA 2011 CRA: max((1% of gross + ₦200K), 20% of gross)',
            self::RENT_RELIEF => 'NTA 2025 Rent Relief: min(₦500K, 20% of annual rent)',
            self::LOW_INCOME_EXEMPTION => 'NTA 2025 full tax exemption for income ≤₦800K/year',
        };
    }

    public function applicableTaxLaw(): ?string
    {
        return match ($this) {
            self::CRA => 'pita_2011',
            self::RENT_RELIEF, self::LOW_INCOME_EXEMPTION => 'nta_2025',
            default => null,
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
