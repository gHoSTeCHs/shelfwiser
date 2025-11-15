<?php

namespace App\Enums;

enum OrderType: string
{
    case CUSTOMER = 'customer';
    case PURCHASE_ORDER = 'purchase_order';
    case INTERNAL = 'internal';

    public function label(): string
    {
        return match ($this) {
            self::CUSTOMER => 'Customer Order',
            self::PURCHASE_ORDER => 'Purchase Order',
            self::INTERNAL => 'Internal Transfer',
        };
    }

    /**
     * Get a brief description of the order type.
     */
    public function description(): string
    {
        return match ($this) {
            self::CUSTOMER => 'B2C order from a customer via storefront or direct sales',
            self::PURCHASE_ORDER => 'B2B order from a supplier for inventory procurement',
            self::INTERNAL => 'Internal transfer of goods between shops within the same tenant',
        };
    }

    /**
     * Get the icon name for the order type (Lucide icons).
     */
    public function icon(): string
    {
        return match ($this) {
            self::CUSTOMER => 'shopping-cart',
            self::PURCHASE_ORDER => 'package',
            self::INTERNAL => 'arrow-right-left',
        };
    }

    /**
     * Get the badge color for the order type.
     */
    public function color(): string
    {
        return match ($this) {
            self::CUSTOMER => 'primary',
            self::PURCHASE_ORDER => 'info',
            self::INTERNAL => 'warning',
        };
    }

    /**
     * Check if this order type is for customer-facing orders.
     */
    public function isCustomerFacing(): bool
    {
        return $this === self::CUSTOMER;
    }

    /**
     * Check if this order type affects supplier relationships.
     */
    public function isSupplierRelated(): bool
    {
        return $this === self::PURCHASE_ORDER;
    }

    /**
     * Check if this order type is for internal operations.
     */
    public function isInternal(): bool
    {
        return $this === self::INTERNAL;
    }

    /**
     * Get order types as options for select inputs.
     */
    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($type) => [$type->value => $type->label()])
            ->toArray();
    }

    /**
     * Get customer-facing order types only.
     */
    public static function customerTypes(): array
    {
        return [
            self::CUSTOMER,
        ];
    }

    /**
     * Get supplier-related order types only.
     */
    public static function supplierTypes(): array
    {
        return [
            self::PURCHASE_ORDER,
        ];
    }
}
