<?php

namespace App\Enums;

enum TaxLawVersion: string
{
    case PITA_2011 = 'pita_2011';
    case NTA_2025 = 'nta_2025';

    public function label(): string
    {
        return match ($this) {
            self::PITA_2011 => 'Personal Income Tax Act 2011',
            self::NTA_2025 => 'Nigeria Tax Act 2025',
        };
    }

    public function shortLabel(): string
    {
        return match ($this) {
            self::PITA_2011 => 'PITA 2011',
            self::NTA_2025 => 'NTA 2025',
        };
    }

    public function effectiveDate(): string
    {
        return match ($this) {
            self::PITA_2011 => '2011-01-01',
            self::NTA_2025 => '2026-01-01',
        };
    }

    public function hasCRA(): bool
    {
        return match ($this) {
            self::PITA_2011 => true,
            self::NTA_2025 => false,
        };
    }

    public function hasRentRelief(): bool
    {
        return match ($this) {
            self::PITA_2011 => false,
            self::NTA_2025 => true,
        };
    }

    public function hasLowIncomeExemption(): bool
    {
        return match ($this) {
            self::PITA_2011 => false,
            self::NTA_2025 => true,
        };
    }

    public function lowIncomeThreshold(): float
    {
        return match ($this) {
            self::PITA_2011 => 0,
            self::NTA_2025 => 800000,
        };
    }

    public static function options(): array
    {
        return collect(self::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'short_label' => $case->shortLabel(),
        ])->all();
    }
}
