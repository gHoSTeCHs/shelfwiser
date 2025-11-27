<?php

namespace App\Enums;

enum CompanySizeCategory: string
{
    case SMALL = 'small';
    case MEDIUM = 'medium';
    case LARGE = 'large';

    /**
     * Get human-readable label for the company size
     */
    public function label(): string
    {
        return match ($this) {
            self::SMALL => 'Small Company',
            self::MEDIUM => 'Medium Company',
            self::LARGE => 'Large Company',
        };
    }

    /**
     * Determine company size category based on annual turnover (Nigerian standard)
     */
    public static function fromTurnover(float $annualTurnover): self
    {
        return match (true) {
            $annualTurnover <= 25000000 => self::SMALL,
            $annualTurnover < 100000000 => self::MEDIUM,
            default => self::LARGE,
        };
    }
}
