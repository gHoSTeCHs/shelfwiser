<?php

namespace App\Enums;

enum PayType: string
{
    case SALARY = 'salary';
    case HOURLY = 'hourly';
    case DAILY = 'daily';
    case COMMISSION_BASED = 'commission_based';

    public function label(): string
    {
        return match ($this) {
            self::SALARY => 'Salary (Annual)',
            self::HOURLY => 'Hourly Rate',
            self::DAILY => 'Daily Rate',
            self::COMMISSION_BASED => 'Commission Based',
        };
    }

    public function requiresHourlyConfig(): bool
    {
        return $this === self::HOURLY;
    }

    public function requiresCommissionConfig(): bool
    {
        return $this === self::COMMISSION_BASED;
    }

    public static function options(): array
    {
        return array_map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ], self::cases());
    }
}
