<?php

namespace App\Enums;

enum StorefrontPageType: string
{
    case HOME = 'home';
    case PRODUCTS = 'products';
    case PRODUCT_DETAIL = 'product_detail';
    case CART = 'cart';
    case CHECKOUT = 'checkout';
    case ABOUT = 'about';
    case CONTACT = 'contact';
    case CUSTOM = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::HOME => 'Home',
            self::PRODUCTS => 'Products',
            self::PRODUCT_DETAIL => 'Product Detail',
            self::CART => 'Cart',
            self::CHECKOUT => 'Checkout',
            self::ABOUT => 'About',
            self::CONTACT => 'Contact',
            self::CUSTOM => 'Custom',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
            ->toArray();
    }
}
