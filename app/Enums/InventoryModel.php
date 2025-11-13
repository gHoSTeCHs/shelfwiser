<?php

namespace App\Enums;

enum InventoryModel: string
{
    case SIMPLE_RETAIL = 'simple_retail';
    case WHOLESALE_ONLY = 'wholesale_only';
    case HYBRID = 'hybrid';

    public function label(): string
    {
        return match ($this) {
            self::SIMPLE_RETAIL => 'Simple Retail',
            self::WHOLESALE_ONLY => 'Wholesale Only',
            self::HYBRID => 'Hybrid (Advanced)',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::SIMPLE_RETAIL => 'Buy in bulk and sell individual items at retail prices. Easy to use, perfect for small shops.',
            self::WHOLESALE_ONLY => 'Sell products in sealed packages only (cartons, packs, etc.). No individual sales.',
            self::HYBRID => 'Sell both retail and wholesale, breaking packages when needed. Maximum flexibility but requires training.',
        };
    }

    public function complexity(): string
    {
        return match ($this) {
            self::SIMPLE_RETAIL => 'low',
            self::WHOLESALE_ONLY => 'medium',
            self::HYBRID => 'high',
        };
    }

    public function suitableFor(): string
    {
        return match ($this) {
            self::SIMPLE_RETAIL => '70% of small shops, retail stores, convenience stores',
            self::WHOLESALE_ONLY => '15% of shops, distributors, wholesalers, cash-and-carry',
            self::HYBRID => '15% of shops, medium-sized supermarkets, growing businesses',
        };
    }

    public function features(): array
    {
        return match ($this) {
            self::SIMPLE_RETAIL => [
                'Single unit pricing',
                'Easy stock management',
                'No packaging complexity',
                'Quick setup',
            ],
            self::WHOLESALE_ONLY => [
                'Package-based sales',
                'Minimum order quantities',
                'Volume discounts',
                'B2B focused',
            ],
            self::HYBRID => [
                'Retail and wholesale pricing',
                'Package state tracking',
                'Smart packaging suggestions',
                'Break packages when needed',
            ],
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($model) => [$model->value => $model->label()])
            ->toArray();
    }

    public static function forSelectWithDescriptions(): array
    {
        return collect(self::cases())
            ->map(fn($model) => [
                'value' => $model->value,
                'label' => $model->label(),
                'description' => $model->description(),
                'complexity' => $model->complexity(),
                'suitable_for' => $model->suitableFor(),
                'features' => $model->features(),
            ])
            ->toArray();
    }
}
