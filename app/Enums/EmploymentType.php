<?php

namespace App\Enums;

enum EmploymentType: string
{
    case FULL_TIME = 'full_time';
    case PART_TIME = 'part_time';
    case CONTRACT = 'contract';
    case SEASONAL = 'seasonal';
    case INTERN = 'intern';

    public function label(): string
    {
        return match ($this) {
            self::FULL_TIME => 'Full Time',
            self::PART_TIME => 'Part Time',
            self::CONTRACT => 'Contract',
            self::SEASONAL => 'Seasonal',
            self::INTERN => 'Intern',
        };
    }

    public function requiresEndDate(): bool
    {
        return match ($this) {
            self::CONTRACT, self::SEASONAL, self::INTERN => true,
            default => false,
        };
    }

    public static function options(): array
    {
        return array_map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ], self::cases());
    }
}
