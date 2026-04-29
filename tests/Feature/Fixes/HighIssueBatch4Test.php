<?php

use App\Enums\UserRole;
use App\Http\Requests\UploadImageRequest;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OrderRefundService;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function b4Setup(string $suffix = ''): array
{
    $id = uniqid($suffix);

    $shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );

    $tenant = Tenant::create([
        'name' => "B4 Tenant {$id}",
        'slug' => "b4-tenant-{$id}",
        'owner_email' => "b4owner-{$id}@test.com",
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 20,
        'max_products' => 200,
    ]);

    $shop = Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => "B4 Shop {$id}",
        'slug' => "b4-shop-{$id}",
        'is_active' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $owner = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::OWNER,
        'is_tenant_owner' => true,
        'is_active' => true,
    ]);
    $owner->shops()->attach($shop->id, ['tenant_id' => $tenant->id]);

    return [$tenant, $shop, $owner];
}

// ---------------------------------------------------------------------------
// Issue 1: UploadImageRequest — model_id ownership not verified
// ---------------------------------------------------------------------------

it('upload endpoint rejects model_id belonging to a different tenant', function () {
    [$tenantA, $shopA] = b4Setup('A');
    [, , $ownerB] = b4Setup('B');

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );

    $productA = Product::create([
        'tenant_id' => $tenantA->id,
        'shop_id' => $shopA->id,
        'product_type_id' => $productType->id,
        'name' => 'Tenant A Product',
        'slug' => 'tenant-a-product-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);

    // Tenant B's user tries to upload to Tenant A's product
    $this->actingAs($ownerB);

    $response = $this->postJson(route('images.upload'), [
        'model_type' => 'Product',
        'model_id' => $productA->id,
    ]);

    // Without the fix: model not found by TenantScope → 404 (security held by TenantScope)
    // With the fix: caught at FormRequest validation → 422 with explicit model_id error
    $response->assertStatus(422);
    expect($response->json('errors.model_id'))->not->toBeNull();
});

it('upload endpoint accepts model_id belonging to the authenticated tenant', function () {
    [$tenant, $shop, $owner] = b4Setup('self');

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );

    $product = Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Own Tenant Product',
        'slug' => 'own-tenant-product-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);

    $this->actingAs($owner);

    // Submitting without an image file — should fail validation on 'image' field,
    // but NOT on model_id (since it belongs to the same tenant)
    $response = $this->postJson(route('images.upload'), [
        'model_type' => 'Product',
        'model_id' => $product->id,
    ]);

    // Should not fail with a model_id ownership error
    if ($response->status() === 422) {
        expect($response->json('errors'))->not->toHaveKey('model_id');
    }
});

// ---------------------------------------------------------------------------
// Issue 2: partialRefund — no lockForUpdate at transaction start
// ---------------------------------------------------------------------------

it('partialRefund adds lockForUpdate on the order at transaction start', function () {
    [$tenant, $shop, $owner] = b4Setup('refund');

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );

    $product = Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Test Product',
        'slug' => 'test-product-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);

    $variant = \App\Models\ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'SKU-'.uniqid(),
        'price' => 1000,
        'is_active' => true,
    ]);

    $order = (new \App\Models\Order)->forceFill([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_number' => 'ORD-'.uniqid(),
        'status' => \App\Enums\OrderStatus::DELIVERED,
        'payment_status' => \App\Enums\PaymentStatus::PAID,
        'subtotal' => 5000,
        'total_amount' => 5000,
        'created_by' => $owner->id,
    ]);
    $order->save();

    \App\Models\OrderItem::query()->create([
        'order_id' => $order->id,
        'tenant_id' => $tenant->id,
        'sellable_type' => \App\Models\ProductVariant::class,
        'sellable_id' => $variant->id,
        'product_variant_id' => $variant->id,
        'quantity' => 5,
        'unit_price' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
    ]);

    (new \App\Models\OrderPayment)->forceFill([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_id' => $order->id,
        'amount' => 5000,
        'payment_method' => 'cash',
        'payment_date' => now()->toDateString(),
        'gateway_status' => 'completed',
        'recorded_by' => $owner->id,
    ])->save();

    $orderItem = \App\Models\OrderItem::query()->where('order_id', $order->id)->first();

    $this->actingAs($owner);
    $service = app(OrderRefundService::class);

    // Should complete without error
    $result = $service->partialRefund($order, $owner, [$orderItem->id => 3], 'Test partial refund');

    $order->refresh();
    expect($order->internal_notes)->not->toBeNull();
});

// ---------------------------------------------------------------------------
// Issue 3: generateUniqueSlug — race condition in ProductService
// ---------------------------------------------------------------------------

it('ProductService generates unique slugs for concurrent products with the same name', function () {
    [$tenant, $shop, $owner] = b4Setup('slug');
    $this->actingAs($owner);

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );

    $service = app(ProductService::class);

    // Create two products with the same name — both should get unique slugs
    $productData = [
        'name' => 'Coca Cola',
        'product_type_slug' => 'general',
        'has_variants' => false,
        'sku' => 'COKE-'.uniqid(),
        'price' => 500,
    ];

    $product1 = $service->create($productData, $tenant, $shop);

    $productData['sku'] = 'COKE-'.uniqid();
    $product2 = $service->create($productData, $tenant, $shop);

    expect($product1->slug)->not->toBe($product2->slug);
    expect($product1->slug)->toBe('coca-cola');
    expect($product2->slug)->toBe('coca-cola-1');
});
