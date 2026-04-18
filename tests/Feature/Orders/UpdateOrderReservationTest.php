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

it('releases reserved inventory when confirmed order items are replaced', function () {
    $tenant = Tenant::query()->create([
        'name' => 'Reservation Test Tenant',
        'slug' => 'reservation-test-tenant',
        'owner_email' => 'owner@reservation-test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $user = User::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'first_name' => 'Test',
        'last_name' => 'Manager',
        'email' => 'manager@reservation-test.com',
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
        'name' => 'Reservation Test Shop',
        'slug' => 'reservation-test-shop',
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
        'name' => 'Reservation Test Product',
        'slug' => 'reservation-test-product',
        'is_active' => true,
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'RESERVATION-TEST-001',
        'price' => 100,
        'is_active' => true,
    ]);

    $location = InventoryLocation::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => 20,
        'reserved_quantity' => 5,
    ]);

    $order = Order::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'customer_id' => null,
        'order_type' => OrderType::CUSTOMER,
        'status' => OrderStatus::CONFIRMED,
        'total_amount' => 500,
        'subtotal' => 500,
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
        'quantity' => 5,
        'unit_price' => 100,
        'total_amount' => 500,
        'tax_amount' => 0,
        'discount_amount' => 0,
    ]);

    app(OrderService::class)->updateOrder($order, ['items' => []]);

    $location->refresh();
    expect($location->reserved_quantity)->toBe(0);
});
