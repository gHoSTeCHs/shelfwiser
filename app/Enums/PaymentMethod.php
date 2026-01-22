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
    case PAYSTACK = 'paystack';
    case CASH_ON_DELIVERY = 'cash_on_delivery';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Cash',
            self::CARD => 'Card',
            self::MOBILE_MONEY => 'Mobile Money',
            self::BANK_TRANSFER => 'Bank Transfer',
            self::CHEQUE => 'Cheque',
            self::CUSTOMER_CREDIT => 'Customer Credit',
            self::PAYSTACK => 'Paystack',
            self::CASH_ON_DELIVERY => 'Cash on Delivery',
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
            self::PAYSTACK => 'Online payment via Paystack',
            self::CASH_ON_DELIVERY => 'Pay when order is delivered',
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
            self::PAYSTACK => 'primary',
            self::CASH_ON_DELIVERY => 'warning',
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
            self::PAYSTACK => 'credit-card',
            self::CASH_ON_DELIVERY => 'truck',
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
            self::PAYSTACK => true,
            self::CASH_ON_DELIVERY => false,
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
            self::PAYSTACK => true,
            self::CASH_ON_DELIVERY => false,
        };
    }

    /**
     * Check if this payment method requires online processing.
     */
    public function requiresOnlineProcessing(): bool
    {
        return match ($this) {
            self::PAYSTACK => true,
            default => false,
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

    /**
     * Get payment methods available for storefront checkout.
     */
    public static function storefrontOptions(): array
    {
        return collect([
            self::CASH_ON_DELIVERY,
            self::PAYSTACK,
            self::BANK_TRANSFER,
        ])->mapWithKeys(fn ($method) => [$method->value => $method->label()])
            ->toArray();
    }

    /**
     * Get storefront payment method values for validation.
     */
    public static function storefrontValues(): array
    {
        return [
            self::CASH_ON_DELIVERY->value,
            self::PAYSTACK->value,
            self::BANK_TRANSFER->value,
        ];
    }
}
