<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\UserRole;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('restores inventory when a PROCESSING order is cancelled', function () {
    $tenant = Tenant::query()->create([
        'name' => 'Test Tenant',
        'slug' => 'cancel-fulfilled-stock-test-tenant',
        'owner_email' => 'owner@cancel-fulfilled-stock-test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $user = User::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'first_name' => 'Test',
        'last_name' => 'Manager',
        'email' => 'manager@cancel-fulfilled-stock-test.com',
        'password' => Hash::make('password'),
        'role' => UserRole::STORE_MANAGER,
        'is_active' => true,
        'email_verified_at' => now(),
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
        'name' => 'Test Shop',
        'slug' => 'cancel-fulfilled-stock-test-shop',
        'is_active' => true,
        'storefront_enabled' => false,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
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
        'name' => 'Fulfilment Test Product',
        'slug' => 'fulfilment-test-product-cancel-fulfilled-stock',
        'is_active' => true,
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'CANCEL-FULFILLED-STOCK-001',
        'price' => 100,
        'is_active' => true,
    ]);

    $location = InventoryLocation::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => 8,
        'reserved_quantity' => 0,
    ]);

    $order = Order::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'customer_id' => null,
        'order_type' => OrderType::POS,
        'status' => OrderStatus::PROCESSING,
        'total_amount' => 300,
        'subtotal' => 300,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'shipping_cost' => 0,
        'created_by' => $user->id,
    ]);

    $order->items()->create([
        'tenant_id' => $tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 3,
        'unit_price' => 100,
        'total_amount' => 300,
        'tax_amount' => 0,
        'discount_amount' => 0,
    ]);

    app(OrderService::class)->cancelOrder($order, $user, 'Customer request');

    $location->refresh();
    expect($location->quantity)->toBe(11);
    expect($order->fresh()->status)->toBe(OrderStatus::CANCELLED);
});

it('restores inventory when a PACKED order is cancelled', function () {
    $tenant = Tenant::query()->create([
        'name' => 'Test Tenant Packed',
        'slug' => 'cancel-packed-stock-test-tenant',
        'owner_email' => 'owner@cancel-packed-stock-test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $user = User::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'first_name' => 'Test',
        'last_name' => 'Manager',
        'email' => 'manager@cancel-packed-stock-test.com',
        'password' => Hash::make('password'),
        'role' => UserRole::STORE_MANAGER,
        'is_active' => true,
        'email_verified_at' => now(),
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
        'name' => 'Test Shop Packed',
        'slug' => 'cancel-packed-stock-test-shop',
        'is_active' => true,
        'storefront_enabled' => false,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
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
        'name' => 'Packed Test Product',
        'slug' => 'packed-test-product-cancel-packed-stock',
        'is_active' => true,
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'CANCEL-PACKED-STOCK-001',
        'price' => 200,
        'is_active' => true,
    ]);

    $location = InventoryLocation::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => 5,
        'reserved_quantity' => 0,
    ]);

    $order = Order::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'customer_id' => null,
        'order_type' => OrderType::POS,
        'status' => OrderStatus::PACKED,
        'total_amount' => 400,
        'subtotal' => 400,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'shipping_cost' => 0,
        'created_by' => $user->id,
    ]);

    $order->items()->create([
        'tenant_id' => $tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'unit_price' => 200,
        'total_amount' => 400,
        'tax_amount' => 0,
        'discount_amount' => 0,
    ]);

    app(OrderService::class)->cancelOrder($order, $user, 'Packing error');

    $location->refresh();
    expect($location->quantity)->toBe(7);
    expect($order->fresh()->status)->toBe(OrderStatus::CANCELLED);
});
