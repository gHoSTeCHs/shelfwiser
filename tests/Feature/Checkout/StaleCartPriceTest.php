<?php

declare(strict_types=1);

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Services\CheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('uses current variant price at checkout, not stale cart snapshot', function () {
    $tenant = Tenant::query()->create([
        'name' => 'Stale Price Test Tenant',
        'slug' => 'stale-price-test-tenant',
        'owner_email' => 'owner@stale-price-test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $shopType = ShopType::query()->firstOrCreate(
        ['slug' => 'retail'],
        [
            'label' => 'Retail Store',
            'config_schema' => [],
            'is_active' => true,
        ]
    );

    $shop = Shop::query()->create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => 'Stale Price Test Shop',
        'slug' => 'stale-price-test-shop',
        'is_active' => true,
        'storefront_enabled' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
        'vat_enabled' => false,
        'vat_rate' => 0,
    ]);

    $customer = Customer::query()->create([
        'tenant_id' => $tenant->id,
        'first_name' => 'Stale',
        'last_name' => 'Price',
        'email' => 'customer@stale-price-test.com',
        'password' => Hash::make('password'),
        'is_active' => true,
    ]);

    $productType = ProductType::query()->firstOrCreate(
        ['slug' => 'general'],
        [
            'label' => 'General Product',
            'config_schema' => [],
            'is_active' => true,
        ]
    );

    $product = Product::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Stale Price Product',
        'slug' => 'stale-price-product',
        'is_active' => true,
        'track_stock' => false,
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'STALE-PRICE-001',
        'price' => 2000,
        'is_active' => true,
        'is_available_online' => true,
    ]);

    InventoryLocation::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => 10,
        'reserved_quantity' => 0,
    ]);

    $cart = Cart::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'customer_id' => $customer->id,
    ]);

    CartItem::query()->create([
        'cart_id' => $cart->id,
        'tenant_id' => $tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 1,
        'price' => 1500,
    ]);

    $order = app(CheckoutService::class)->createOrderFromCart(
        $cart,
        $customer,
        ['line1' => '1 Test St'],
        ['line1' => '1 Test St'],
        'cash_on_delivery'
    );

    expect((float) $order->items->first()->unit_price)->toBe(2000.0);
    expect((float) $order->subtotal)->toBe(2000.0);
});
