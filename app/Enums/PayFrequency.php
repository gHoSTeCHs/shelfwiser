<?php

namespace App\Enums;

enum PayFrequency: string
{
    case DAILY = 'daily';
    case WEEKLY = 'weekly';
    case BI_WEEKLY = 'bi_weekly';
    case SEMI_MONTHLY = 'semi_monthly';
    case MONTHLY = 'monthly';

    /**
     * Get human-readable label for the pay frequency
     */
    public function label(): string
    {
        return match ($this) {
            self::DAILY => 'Daily',
            self::WEEKLY => 'Weekly',
            self::BI_WEEKLY => 'Bi-Weekly (Every 2 Weeks)',
            self::SEMI_MONTHLY => 'Semi-Monthly (Twice a Month)',
            self::MONTHLY => 'Monthly',
        };
    }

    /**
     * Get the number of pay periods per year
     */
    public function periodsPerYear(): int
    {
        return match ($this) {
            self::DAILY => 365,
            self::WEEKLY => 52,
            self::BI_WEEKLY => 26,
            self::SEMI_MONTHLY => 24,
            self::MONTHLY => 12,
        };
    }
}
