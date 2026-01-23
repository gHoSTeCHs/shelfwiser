<?php

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
use App\Models\Customer;
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

    $this->order = Order::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $this->customer->id,
        'order_number' => 'ORD-001',
        'subtotal_amount' => 0,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'shipping_amount' => 0,
        'total_amount' => 0,
    ]);
});

test('order item can be created with product variant', function () {
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'unit_price' => 50.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
    ]);

    expect($orderItem->exists)->toBeTrue();
    expect($orderItem->product_variant_id)->toBe($variant->id);
    expect($orderItem->sellable_type)->toBe(ProductVariant::class);
    expect($orderItem->sellable_id)->toBe($variant->id);
});

test('order item can be created with service variant and null product_variant_id', function () {
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'unit_price' => 100.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
        'metadata' => [
            'material_option' => 'none',
            'selected_addons' => [],
        ],
    ]);

    expect($orderItem->exists)->toBeTrue();
    expect($orderItem->product_variant_id)->toBeNull();
    expect($orderItem->sellable_type)->toBe(ServiceVariant::class);
    expect($orderItem->sellable_id)->toBe($serviceVariant->id);
});

test('isProduct returns true for product order items', function () {
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'unit_price' => 50.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
    ]);

    expect($orderItem->isProduct())->toBeTrue();
    expect($orderItem->isService())->toBeFalse();
});

test('isService returns true for service order items', function () {
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'unit_price' => 100.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
    ]);

    expect($orderItem->isService())->toBeTrue();
    expect($orderItem->isProduct())->toBeFalse();
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 2,
        'unit_price' => 50.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
    ]);

    expect($orderItem->sellable)->toBeInstanceOf(ProductVariant::class);
    expect($orderItem->sellable->id)->toBe($variant->id);
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'unit_price' => 100.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
    ]);

    expect($orderItem->sellable)->toBeInstanceOf(ServiceVariant::class);
    expect($orderItem->sellable->id)->toBe($serviceVariant->id);
});

test('calculateTotal method calculates correctly', function () {
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

    $orderItem = OrderItem::make([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 3,
        'unit_price' => 50.00,
        'discount_amount' => 10.00,
        'tax_amount' => 5.00,
    ]);

    $orderItem->calculateTotal();

    expect((float)$orderItem->total_amount)->toBe(145.00);
});

test('metadata casts to array correctly', function () {
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'unit_price' => 100.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
        'metadata' => [
            'material_option' => 'shop_materials',
            'selected_addons' => [
                ['addon_id' => 1, 'name' => 'Extra Service', 'price' => 20.00],
            ],
        ],
    ]);

    expect($orderItem->metadata)->toBeArray();
    expect($orderItem->metadata)->toHaveKey('material_option');
    expect($orderItem->metadata['material_option'])->toBe('shop_materials');
});

test('getProductNameAttribute returns service name for services', function () {
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'unit_price' => 100.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
    ]);

    $orderItem->load('sellable.service');

    expect($orderItem->product_name)->toBe('Test Service');
});

test('getSkuAttribute returns service SKU for services', function () {
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

    $orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => null,
        'sellable_type' => ServiceVariant::class,
        'sellable_id' => $serviceVariant->id,
        'quantity' => 1,
        'unit_price' => 100.00,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 100.00,
    ]);

    expect($orderItem->sku)->toBe('SVC-'.$serviceVariant->id);
});
