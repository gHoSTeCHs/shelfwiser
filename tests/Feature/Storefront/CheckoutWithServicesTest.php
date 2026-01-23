<?php

use App\Enums\MaterialOption;
use App\Enums\PaymentMethod;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::create([
        'name' => 'Test Tenant',
        'slug' => 'test-tenant',
        'owner_email' => 'owner@test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $this->shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        [
            'label' => 'Retail Store',
            'config_schema' => [],
            'is_active' => true,
        ]
    );

    $this->shop = Shop::create([
        'tenant_id' => $this->tenant->id,
        'shop_type_id' => $this->shopType->id,
        'name' => 'Test Shop',
        'slug' => 'test-shop',
        'is_active' => true,
        'storefront_enabled' => true,
        'currency' => 'KES',
        'currency_symbol' => 'KSh',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $this->customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'first_name' => 'Test',
        'last_name' => 'Customer',
        'email' => 'customer@test.com',
        'password' => Hash::make('password'),
        'is_active' => true,
    ]);

    $this->productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        [
            'label' => 'General Product',
            'config_schema' => [],
            'is_active' => true,
        ]
    );

    $this->product = Product::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => $this->productType->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'is_active' => true,
    ]);

    $this->productVariant = ProductVariant::create([
        'product_id' => $this->product->id,
        'name' => 'Test Product Variant',
        'sku' => 'TEST-001',
        'price' => 50.00,
        'is_active' => true,
    ]);

    \App\Models\InventoryLocation::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_variant_id' => $this->productVariant->id,
        'location_type' => Shop::class,
        'location_id' => $this->shop->id,
        'quantity' => 100,
        'reserved_quantity' => 0,
    ]);

    $this->serviceCategory = ServiceCategory::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    $this->service = Service::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'service_category_id' => $this->serviceCategory->id,
        'name' => 'Test Service',
        'slug' => 'test-service',
        'description' => 'Test service description',
        'is_active' => true,
        'is_available_online' => true,
    ]);

    $this->serviceVariant = ServiceVariant::create([
        'service_id' => $this->service->id,
        'name' => 'Default Variant',
        'base_price' => 100.00,
        'customer_materials_price' => 80.00,
        'shop_materials_price' => 120.00,
        'is_active' => true,
    ]);

    $this->shippingAddress = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'phone' => '+254700000000',
        'address_line_1' => '123 Test Street',
        'address_line_2' => 'Apartment 4B',
        'city' => 'Nairobi',
        'state' => 'Nairobi',
        'postal_code' => '00100',
        'country' => 'Kenya',
    ];
});

test('can checkout with services only', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    $response = $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.checkout.process', $this->shop), [
            'shipping_address' => $this->shippingAddress,
            'billing_same_as_shipping' => true,
            'billing_address' => $this->shippingAddress,
            'payment_method' => PaymentMethod::CASH_ON_DELIVERY->value,
            'save_addresses' => false,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('orders', [
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    $order = Order::query()->where('customer_id', $this->customer->id)->first();

    $this->assertDatabaseHas('order_items', [
        'order_id' => $order->id,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'product_variant_id' => null,
    ]);
});

test('can checkout with mixed cart containing products and services', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $this->productVariant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $this->productVariant->id,
        'quantity' => 2,
        'price' => 50.00,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    $response = $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.checkout.process', $this->shop), [
            'shipping_address' => $this->shippingAddress,
            'billing_same_as_shipping' => true,
            'billing_address' => $this->shippingAddress,
            'payment_method' => PaymentMethod::CASH_ON_DELIVERY->value,
            'save_addresses' => false,
        ]);

    $response->assertRedirect();

    $order = Order::query()->where('customer_id', $this->customer->id)->first();

    expect($order->items)->toHaveCount(2);

    $this->assertDatabaseHas('order_items', [
        'order_id' => $order->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $this->productVariant->id,
        'product_variant_id' => $this->productVariant->id,
    ]);

    $this->assertDatabaseHas('order_items', [
        'order_id' => $order->id,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'product_variant_id' => null,
    ]);
});

test('service order item preserves material option in metadata', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'quantity' => 1,
        'price' => 120.00,
        'material_option' => MaterialOption::SHOP_MATERIALS,
        'base_price' => 120.00,
    ]);

    $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.checkout.process', $this->shop), [
            'shipping_address' => $this->shippingAddress,
            'billing_same_as_shipping' => true,
            'billing_address' => $this->shippingAddress,
            'payment_method' => PaymentMethod::CASH_ON_DELIVERY->value,
            'save_addresses' => false,
        ]);

    $order = Order::query()->where('customer_id', $this->customer->id)->first();
    $orderItem = OrderItem::query()
        ->where('order_id', $order->id)
        ->where('sellable_type', ServiceVariant::class)
        ->first();

    expect($orderItem)->not->toBeNull();
    expect($orderItem->metadata)->toBeArray();
    expect($orderItem->metadata)->toHaveKey('material_option');
    expect($orderItem->product_variant_id)->toBeNull();
});

test('service order item uses polymorphic sellable relationship', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.checkout.process', $this->shop), [
            'shipping_address' => $this->shippingAddress,
            'billing_same_as_shipping' => true,
            'billing_address' => $this->shippingAddress,
            'payment_method' => PaymentMethod::CASH_ON_DELIVERY->value,
            'save_addresses' => false,
        ]);

    $order = Order::query()->where('customer_id', $this->customer->id)->first();
    $orderItem = OrderItem::query()
        ->where('order_id', $order->id)
        ->where('sellable_type', ServiceVariant::class)
        ->first();

    expect($orderItem->sellable)->toBeInstanceOf(ServiceVariant::class);
    expect($orderItem->sellable->id)->toBe($this->serviceVariant->id);
    expect($orderItem->isService())->toBeTrue();
    expect($orderItem->isProduct())->toBeFalse();
    expect($orderItem->product_variant_id)->toBeNull();
});

test('order totals calculate correctly with services', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $this->productVariant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $this->productVariant->id,
        'quantity' => 2,
        'price' => 50.00,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.checkout.process', $this->shop), [
            'shipping_address' => $this->shippingAddress,
            'billing_same_as_shipping' => true,
            'billing_address' => $this->shippingAddress,
            'payment_method' => PaymentMethod::CASH_ON_DELIVERY->value,
            'save_addresses' => false,
        ]);

    $order = Order::query()->where('customer_id', $this->customer->id)->first();

    expect($order->items)->toHaveCount(2);
    expect($order->items->sum('total_amount'))->toBe(200.00);
});

test('cart is cleared after successful checkout with services', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.checkout.process', $this->shop), [
            'shipping_address' => $this->shippingAddress,
            'billing_same_as_shipping' => true,
            'billing_address' => $this->shippingAddress,
            'payment_method' => PaymentMethod::CASH_ON_DELIVERY->value,
            'save_addresses' => false,
        ]);

    $cart->refresh();

    expect($cart->items)->toHaveCount(0);
});
