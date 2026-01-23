<?php

use App\Enums\MaterialOption;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;

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
        'currency' => 'KES',
        'currency_symbol' => 'KSh',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $this->cart = Cart::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
    ]);
});

test('cart item can be created with product variant', function () {
    $product = Product::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => ProductType::firstOrCreate(
            ['slug' => 'general'],
            ['label' => 'General', 'is_active' => true, 'config_schema' => []]
        )->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'is_active' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Test Variant',
        'sku' => 'TEST-001',
        'price' => 50.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'price' => 50.00,
    ]);

    expect($cartItem->exists)->toBeTrue();
    expect($cartItem->product_variant_id)->toBe($variant->id);
    expect($cartItem->sellable_type)->toBe(ProductVariant::class);
    expect($cartItem->sellable_id)->toBe($variant->id);
});

test('cart item can be created with service variant and null product_variant_id', function () {
    $category = ServiceCategory::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    $service = Service::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'service_category_id' => $category->id,
        'name' => 'Test Service',
        'slug' => 'test-service',
        'is_active' => true,
        'is_available_online' => true,
    ]);

    $serviceVariant = ServiceVariant::create([
        'service_id' => $service->id,
        'name' => 'Default Variant',
        'base_price' => 100.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    expect($cartItem->exists)->toBeTrue();
    expect($cartItem->product_variant_id)->toBeNull();
    expect($cartItem->sellable_type)->toBe(ServiceVariant::class);
    expect($cartItem->sellable_id)->toBe($serviceVariant->id);
});

test('isProduct returns true for product cart items', function () {
    $product = Product::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => ProductType::firstOrCreate(
            ['slug' => 'general'],
            ['label' => 'General', 'is_active' => true, 'config_schema' => []]
        )->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'is_active' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Test Variant',
        'sku' => 'TEST-001',
        'price' => 50.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'price' => 50.00,
    ]);

    expect($cartItem->isProduct())->toBeTrue();
    expect($cartItem->isService())->toBeFalse();
});

test('isService returns true for service cart items', function () {
    $category = ServiceCategory::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    $service = Service::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'service_category_id' => $category->id,
        'name' => 'Test Service',
        'slug' => 'test-service',
        'is_active' => true,
        'is_available_online' => true,
    ]);

    $serviceVariant = ServiceVariant::create([
        'service_id' => $service->id,
        'name' => 'Default Variant',
        'base_price' => 100.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    expect($cartItem->isService())->toBeTrue();
    expect($cartItem->isProduct())->toBeFalse();
});

test('sellable relationship works for product variants', function () {
    $product = Product::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => ProductType::firstOrCreate(
            ['slug' => 'general'],
            ['label' => 'General', 'is_active' => true, 'config_schema' => []]
        )->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'is_active' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Test Variant',
        'sku' => 'TEST-001',
        'price' => 50.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'price' => 50.00,
    ]);

    expect($cartItem->sellable)->toBeInstanceOf(ProductVariant::class);
    expect($cartItem->sellable->id)->toBe($variant->id);
});

test('sellable relationship works for service variants', function () {
    $category = ServiceCategory::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    $service = Service::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'service_category_id' => $category->id,
        'name' => 'Test Service',
        'slug' => 'test-service',
        'is_active' => true,
        'is_available_online' => true,
    ]);

    $serviceVariant = ServiceVariant::create([
        'service_id' => $service->id,
        'name' => 'Default Variant',
        'base_price' => 100.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::NONE,
        'base_price' => 100.00,
    ]);

    expect($cartItem->sellable)->toBeInstanceOf(ServiceVariant::class);
    expect($cartItem->sellable->id)->toBe($serviceVariant->id);
});

test('subtotal attribute calculates correctly', function () {
    $product = Product::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => ProductType::firstOrCreate(
            ['slug' => 'general'],
            ['label' => 'General', 'is_active' => true, 'config_schema' => []]
        )->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'is_active' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Test Variant',
        'sku' => 'TEST-001',
        'price' => 50.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 3,
        'price' => 50.00,
    ]);

    expect($cartItem->subtotal)->toBe(150.00);
});

test('material option casts to enum correctly', function () {
    $category = ServiceCategory::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    $service = Service::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'service_category_id' => $category->id,
        'name' => 'Test Service',
        'slug' => 'test-service',
        'is_active' => true,
        'is_available_online' => true,
    ]);

    $serviceVariant = ServiceVariant::create([
        'service_id' => $service->id,
        'name' => 'Default Variant',
        'base_price' => 100.00,
        'is_active' => true,
    ]);

    $cartItem = CartItem::create([
        'cart_id' => $this->cart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'price' => 100.00,
        'material_option' => MaterialOption::SHOP_MATERIALS,
        'base_price' => 100.00,
    ]);

    expect($cartItem->material_option)->toBeInstanceOf(MaterialOption::class);
    expect($cartItem->material_option)->toBe(MaterialOption::SHOP_MATERIALS);
});
