<?php

namespace App\Enums;

enum StockMovementType: string
{
    case PURCHASE = 'purchase';
    case SALE = 'sale';
    case ADJUSTMENT_IN = 'adjustment_in';
    case ADJUSTMENT_OUT = 'adjustment_out';
    case TRANSFER_IN = 'transfer_in';
    case TRANSFER_OUT = 'transfer_out';
    case RETURN = 'return';
    case DAMAGE = 'damage';
    case LOSS = 'loss';
    case STOCK_TAKE = 'stock_take';

    public function label(): string
    {
        return match ($this) {
            self::PURCHASE => 'Purchase',
            self::SALE => 'Sale',
            self::ADJUSTMENT_IN => 'Stock In (Adjustment)',
            self::ADJUSTMENT_OUT => 'Stock Out (Adjustment)',
            self::TRANSFER_IN => 'Transfer In',
            self::TRANSFER_OUT => 'Transfer Out',
            self::RETURN => 'Return',
            self::DAMAGE => 'Damaged',
            self::LOSS => 'Loss/Theft',
            self::STOCK_TAKE => 'Stock Take',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PURCHASE => 'Stock received from supplier or purchase order',
            self::SALE => 'Stock sold to customer',
            self::ADJUSTMENT_IN => 'Manual increase in stock quantity',
            self::ADJUSTMENT_OUT => 'Manual decrease in stock quantity',
            self::TRANSFER_IN => 'Stock received from another location',
            self::TRANSFER_OUT => 'Stock sent to another location',
            self::RETURN => 'Stock returned from customer',
            self::DAMAGE => 'Stock damaged or defective',
            self::LOSS => 'Stock lost or stolen',
            self::STOCK_TAKE => 'Physical inventory count adjustment',
        };
    }

    public function isIncrease(): bool
    {
        return in_array($this, [
            self::PURCHASE,
            self::ADJUSTMENT_IN,
            self::TRANSFER_IN,
            self::RETURN,
            self::STOCK_TAKE,
        ]);
    }

    public function isDecrease(): bool
    {
        return in_array($this, [
            self::SALE,
            self::ADJUSTMENT_OUT,
            self::TRANSFER_OUT,
            self::DAMAGE,
            self::LOSS,
        ]);
    }

    public function requiresLocation(): bool
    {
        return in_array($this, [
            self::TRANSFER_IN,
            self::TRANSFER_OUT,
        ]);
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($type) => [$type->value => $type->label()])
            ->toArray();
    }

    public static function adjustmentTypes(): array
    {
        return [
            self::ADJUSTMENT_IN,
            self::ADJUSTMENT_OUT,
            self::STOCK_TAKE,
        ];
    }

    public static function transferTypes(): array
    {
        return [
            self::TRANSFER_IN,
            self::TRANSFER_OUT,
        ];
    }
}
