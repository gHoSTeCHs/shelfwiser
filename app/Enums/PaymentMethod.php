<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case CARD = 'card';
    case MOBILE_MONEY = 'mobile_money';
    case BANK_TRANSFER = 'bank_transfer';
    case CHEQUE = 'cheque';
    case CUSTOMER_CREDIT = 'customer_credit';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Cash',
            self::CARD => 'Card',
            self::MOBILE_MONEY => 'Mobile Money',
            self::BANK_TRANSFER => 'Bank Transfer',
            self::CHEQUE => 'Cheque',
            self::CUSTOMER_CREDIT => 'Customer Credit',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::CASH => 'Physical cash payment',
            self::CARD => 'Credit or debit card payment',
            self::MOBILE_MONEY => 'Mobile money transfer (M-Pesa, etc.)',
            self::BANK_TRANSFER => 'Direct bank transfer or wire',
            self::CHEQUE => 'Payment by cheque',
            self::CUSTOMER_CREDIT => 'Payment from customer credit balance',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::CASH => 'success',
            self::CARD => 'primary',
            self::MOBILE_MONEY => 'warning',
            self::BANK_TRANSFER => 'info',
            self::CHEQUE => 'gray',
            self::CUSTOMER_CREDIT => 'purple',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::CASH => 'banknote',
            self::CARD => 'credit-card',
            self::MOBILE_MONEY => 'smartphone',
            self::BANK_TRANSFER => 'building-2',
            self::CHEQUE => 'file-text',
            self::CUSTOMER_CREDIT => 'wallet',
        };
    }

    /**
     * Check if this payment method requires a reference number.
     */
    public function requiresReference(): bool
    {
        return match ($this) {
            self::CASH => false,
            self::CARD => true,
            self::MOBILE_MONEY => true,
            self::BANK_TRANSFER => true,
            self::CHEQUE => true,
            self::CUSTOMER_CREDIT => false,
        };
    }

    /**
     * Check if this payment method is instant (no verification delay).
     */
    public function isInstant(): bool
    {
        return match ($this) {
            self::CASH => true,
            self::CARD => true,
            self::MOBILE_MONEY => true,
            self::BANK_TRANSFER => false,
            self::CHEQUE => false,
            self::CUSTOMER_CREDIT => true,
        };
    }

    /**
     * Get all payment methods as options for select inputs.
     */
    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($method) => [$method->value => $method->label()])
            ->toArray();
    }

    /**
     * Get payment methods available for POS (excludes cheque by default).
     */
    public static function posOptions(): array
    {
        return collect([
            self::CASH,
            self::CARD,
            self::MOBILE_MONEY,
            self::BANK_TRANSFER,
        ])->mapWithKeys(fn ($method) => [$method->value => $method->label()])
            ->toArray();
    }

    /**
     * Get all instant payment methods.
     */
    public static function instantMethods(): array
    {
        return array_filter(
            self::cases(),
            fn ($method) => $method->isInstant()
        );
    }
}
