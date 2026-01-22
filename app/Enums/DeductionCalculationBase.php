<?php

namespace App\Enums;

enum DeductionCalculationBase: string
{
    case GROSS = 'gross';
    case BASIC = 'basic';
    case TAXABLE = 'taxable';
    case PENSIONABLE = 'pensionable';
    case NET = 'net';

    public function label(): string
    {
        return match ($this) {
            self::GROSS => 'Gross Earnings',
            self::BASIC => 'Basic Salary',
            self::TAXABLE => 'Taxable Income',
            self::PENSIONABLE => 'Pensionable Earnings',
            self::NET => 'Net Pay',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::GROSS => 'Total earnings before any deductions',
            self::BASIC => 'Base salary only (excludes allowances)',
            self::TAXABLE => 'Income after pre-tax deductions',
            self::PENSIONABLE => 'Earnings eligible for pension calculation',
            self::NET => 'Pay after all other deductions',
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
