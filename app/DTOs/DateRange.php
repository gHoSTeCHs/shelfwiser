<?php

namespace App\DTOs;

use Carbon\Carbon;

final readonly class DateRange
{
    public function __construct(
        public Carbon $start,
        public Carbon $end,
    ) {}

    /**
     * Build from validated request data with sensible defaults.
     * Defaults to current month if no dates are provided.
     */
    public static function fromRequest(
        array $validated,
        string $fromKey = 'from',
        string $toKey = 'to'
    ): self {
        return new self(
            start: isset($validated[$fromKey])
                ? Carbon::parse($validated[$fromKey])->startOfDay()
                : now()->startOfMonth(),
            end: isset($validated[$toKey])
                ? Carbon::parse($validated[$toKey])->endOfDay()
                : now()->endOfMonth(),
        );
    }

    /**
     * Formatted strings for passing back to the frontend as filter state.
     *
     * @return array{from: string, to: string}
     */
    public function toFilterArray(): array
    {
        return [
            'from' => $this->start->format('Y-m-d'),
            'to' => $this->end->format('Y-m-d'),
        ];
    }
}
