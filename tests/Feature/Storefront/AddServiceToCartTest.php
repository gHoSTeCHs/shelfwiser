<?php

use App\Enums\MaterialOption;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Service;
use App\Models\ServiceAddon;
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

    $this->category = ServiceCategory::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    $this->service = Service::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'service_category_id' => $this->category->id,
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

    $this->addon = ServiceAddon::create([
        'service_id' => $this->service->id,
        'name' => 'Test Addon',
        'price' => 20.00,
        'is_active' => true,
    ]);
});

test('unauthenticated customer can add service to cart', function () {
    $response = $this->postJson(route('storefront.cart.store-service', $this->shop), [
        'service_variant_id' => $this->serviceVariant->id,
        'quantity' => 1,
        'material_option' => 'none',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('cart_items', [
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'product_variant_id' => null,
        'quantity' => 1,
    ]);
});

test('authenticated customer can add service to cart', function () {
    $response = $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.cart.store-service', $this->shop), [
            'service_variant_id' => $this->serviceVariant->id,
            'quantity' => 1,
            'material_option' => 'none',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('cart_items', [
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
        'product_variant_id' => null,
        'quantity' => 1,
    ]);
});

test('can add service with customer materials option', function () {
    $response = $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.cart.store-service', $this->shop), [
            'service_variant_id' => $this->serviceVariant->id,
            'quantity' => 1,
            'material_option' => 'customer_materials',
        ]);

    $response->assertRedirect();

    $cartItem = CartItem::query()
        ->where('sellable_type', ServiceVariant::class)
        ->where('sellable_id', $this->serviceVariant->id)
        ->first();

    expect($cartItem)->not->toBeNull();
    expect($cartItem->material_option)->toBe(MaterialOption::CUSTOMER_MATERIALS);
    expect($cartItem->product_variant_id)->toBeNull();
});

test('can add service with shop materials option', function () {
    $response = $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.cart.store-service', $this->shop), [
            'service_variant_id' => $this->serviceVariant->id,
            'quantity' => 1,
            'material_option' => 'shop_materials',
        ]);

    $response->assertRedirect();

    $cartItem = CartItem::query()
        ->where('sellable_type', ServiceVariant::class)
        ->where('sellable_id', $this->serviceVariant->id)
        ->first();

    expect($cartItem)->not->toBeNull();
    expect($cartItem->material_option)->toBe(MaterialOption::SHOP_MATERIALS);
    expect($cartItem->product_variant_id)->toBeNull();
});

test('can add service with addons', function () {
    $response = $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.cart.store-service', $this->shop), [
            'service_variant_id' => $this->serviceVariant->id,
            'quantity' => 1,
            'material_option' => 'none',
            'selected_addons' => [
                [
                    'addon_id' => $this->addon->id,
                    'quantity' => 2,
                ],
            ],
        ]);

    $response->assertRedirect();

    $cartItem = CartItem::query()
        ->where('sellable_type', ServiceVariant::class)
        ->where('sellable_id', $this->serviceVariant->id)
        ->first();

    expect($cartItem)->not->toBeNull();
    expect($cartItem->selected_addons)->toBeArray();
    expect($cartItem->selected_addons)->toHaveCount(1);
    expect($cartItem->product_variant_id)->toBeNull();
});

test('service validation enforced by CartService', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    $serviceCount = CartItem::query()
        ->where('cart_id', $cart->id)
        ->where('sellable_type', ServiceVariant::class)
        ->count();

    expect($serviceCount)->toBe(0);
});

test('cannot add service not available online to cart', function () {
    $this->service->update(['is_available_online' => false]);

    $response = $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.cart.store-service', $this->shop), [
            'service_variant_id' => $this->serviceVariant->id,
            'quantity' => 1,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseMissing('cart_items', [
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $this->serviceVariant->id,
    ]);
});

test('service cart item uses polymorphic sellable columns', function () {
    $this->actingAs($this->customer, 'customer')
        ->postJson(route('storefront.cart.store-service', $this->shop), [
            'service_variant_id' => $this->serviceVariant->id,
            'quantity' => 1,
            'material_option' => 'none',
        ]);

    $cartItem = CartItem::query()
        ->where('sellable_type', ServiceVariant::class)
        ->where('sellable_id', $this->serviceVariant->id)
        ->first();

    expect($cartItem->sellable)->toBeInstanceOf(ServiceVariant::class);
    expect($cartItem->sellable->id)->toBe($this->serviceVariant->id);
    expect($cartItem->isService())->toBeTrue();
    expect($cartItem->isProduct())->toBeFalse();
    expect($cartItem->product_variant_id)->toBeNull();
});

test('cart can contain both products and services', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    $product = \App\Models\Product::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => \App\Models\ProductType::firstOrCreate(
            ['slug' => 'general'],
            ['label' => 'General', 'is_active' => true, 'config_schema' => []]
        )->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'is_active' => true,
    ]);

    $productVariant = \App\Models\ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Test Variant',
        'sku' => 'TEST-001',
        'price' => 50.00,
        'is_active' => true,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $productVariant->id,
        'sellable_type' => \App\Models\ProductVariant::class,
        'sellable_id' => $productVariant->id,
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

    $cart->refresh();

    expect($cart->items)->toHaveCount(2);
    expect($cart->items[0]->isProduct())->toBeTrue();
    expect($cart->items[1]->isService())->toBeTrue();
});

test('cart items use sellable polymorphic relationship for uniqueness', function () {
    $cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
    ]);

    $cartItem = CartItem::create([
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

    expect($cartItem->exists)->toBeTrue();
    expect($cartItem->sellable_type)->toBe(ServiceVariant::class);
    expect($cartItem->sellable_id)->toBe($this->serviceVariant->id);
    expect($cartItem->product_variant_id)->toBeNull();
});
