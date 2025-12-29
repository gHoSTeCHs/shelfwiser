<?php

namespace App\Enums;

enum PayRunItemStatus: string
{
    case PENDING = 'pending';
    case CALCULATED = 'calculated';
    case ERROR = 'error';
    case EXCLUDED = 'excluded';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::CALCULATED => 'Calculated',
            self::ERROR => 'Error',
            self::EXCLUDED => 'Excluded',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'gray',
            self::CALCULATED => 'green',
            self::ERROR => 'red',
            self::EXCLUDED => 'amber',
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
