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
}
