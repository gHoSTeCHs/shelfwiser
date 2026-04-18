<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Services\CheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('restores inventory when a customer cancels a storefront order', function () {
    $tenant = Tenant::query()->create([
        'name' => 'Test Tenant',
        'slug' => 'cancel-stock-test-tenant',
        'owner_email' => 'owner@cancel-stock-test.com',
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
        'name' => 'Test Shop',
        'slug' => 'cancel-stock-test-shop',
        'is_active' => true,
        'storefront_enabled' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $customer = Customer::query()->create([
        'tenant_id' => $tenant->id,
        'first_name' => 'Test',
        'last_name' => 'Customer',
        'email' => 'customer@cancel-stock-test.com',
        'password' => Hash::make('password'),
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => \App\Models\ProductType::query()->firstOrCreate(
            ['slug' => 'general'],
            [
                'label' => 'General Product',
                'config_schema' => [],
                'is_active' => true,
            ]
        )->id,
        'name' => 'Cancellable Product',
        'slug' => 'cancellable-product-cancel-stock-test',
        'is_active' => true,
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'CANCEL-STOCK-TEST-001',
        'price' => 100,
        'is_active' => true,
    ]);

    $location = InventoryLocation::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => 3,
        'reserved_quantity' => 0,
    ]);

    $order = Order::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'customer_id' => $customer->id,
        'order_type' => OrderType::CUSTOMER->value,
        'status' => OrderStatus::PENDING->value,
        'total_amount' => 200,
        'subtotal' => 200,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'shipping_cost' => 0,
        'created_by' => null,
    ]);

    $order->items()->create([
        'tenant_id' => $tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'unit_price' => 100,
        'total_amount' => 200,
        'tax_amount' => 0,
        'discount_amount' => 0,
    ]);

    app(CheckoutService::class)->cancelByCustomer($order->id, $customer, $shop, 'Changed my mind');

    $location->refresh();
    expect($location->quantity)->toBe(5);
    expect($order->fresh()->status)->toBe(OrderStatus::CANCELLED);
});
