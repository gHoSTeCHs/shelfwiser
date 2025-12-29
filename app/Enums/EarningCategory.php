<?php

namespace App\Enums;

enum EarningCategory: string
{
    case BASE = 'base';
    case ALLOWANCE = 'allowance';
    case BONUS = 'bonus';
    case COMMISSION = 'commission';
    case OVERTIME = 'overtime';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::BASE => 'Base Salary',
            self::ALLOWANCE => 'Allowance',
            self::BONUS => 'Bonus',
            self::COMMISSION => 'Commission',
            self::OVERTIME => 'Overtime Pay',
            self::OTHER => 'Other Earnings',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::BASE => 'Basic salary or wage component',
            self::ALLOWANCE => 'Regular allowances (housing, transport, etc.)',
            self::BONUS => 'Performance or periodic bonuses',
            self::COMMISSION => 'Sales or target-based commissions',
            self::OVERTIME => 'Payment for extra hours worked',
            self::OTHER => 'Miscellaneous earnings',
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
