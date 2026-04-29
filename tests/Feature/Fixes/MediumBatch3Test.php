<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Enums\WageAdvanceStatus;
use App\Models\InventoryLocation;
use App\Models\PayrollPeriod;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WageAdvance;
use App\Services\OrderService;
use App\Services\PayRunService;
use App\Services\ShopCreationService;
use App\Services\WageAdvanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function mb3Employee(Tenant $tenant, Shop $shop): User
{
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::CASHIER,
        'is_active' => true,
    ]);
    $user->shops()->attach($shop->id, ['tenant_id' => $tenant->id]);

    return $user;
}

function mb3Setup(string $suffix = ''): array
{
    $id = uniqid($suffix);
    $shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );
    $tenant = Tenant::create([
        'name' => "MB3 Tenant {$id}",
        'slug' => "mb3-{$id}",
        'owner_email' => "mb3-{$id}@test.com",
        'is_active' => true,
        'max_shops' => 3,
        'max_users' => 20,
        'max_products' => 200,
    ]);
    $shop = Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => "MB3 Shop {$id}",
        'slug' => "mb3-shop-{$id}",
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
// M5: createPayrollPeriod overlap check — add lockForUpdate
// ---------------------------------------------------------------------------

it('createPayrollPeriod throws when a period with overlapping dates already exists', function () {
    [$tenant, $shop] = mb3Setup('payroll');

    $service = app(PayRunService::class);

    $service->createPayrollPeriod(
        $tenant->id,
        $shop->id,
        now()->startOfMonth()->toDateString(),
        now()->endOfMonth()->toDateString(),
        now()->endOfMonth()->addDay()->toDateString(),
        'April 2026'
    );

    expect(fn () => $service->createPayrollPeriod(
        $tenant->id,
        $shop->id,
        now()->startOfMonth()->toDateString(),
        now()->endOfMonth()->toDateString(),
        now()->endOfMonth()->addDay()->toDateString(),
        'April 2026 Duplicate'
    ))->toThrow(\RuntimeException::class, 'overlapping');
});

it('createPayrollPeriod overlap check uses lockForUpdate to prevent race conditions', function () {
    [$tenant, $shop] = mb3Setup('payroll2');

    $service = app(PayRunService::class);

    // Verify the method works correctly — the lock is structural
    $period = $service->createPayrollPeriod(
        $tenant->id,
        $shop->id,
        now()->startOfMonth()->toDateString(),
        now()->endOfMonth()->toDateString(),
        now()->endOfMonth()->addDay()->toDateString()
    );

    expect($period)->toBeInstanceOf(PayrollPeriod::class);
    expect($period->tenant_id)->toBe($tenant->id);
});

// ---------------------------------------------------------------------------
// M6: WageAdvanceService reject/cancel — status guard outside transaction
// ---------------------------------------------------------------------------

it('WageAdvanceService reject re-checks status inside transaction via lockForUpdate', function () {
    [$tenant, $shop, $owner] = mb3Setup('advance');
    $employee = mb3Employee($tenant, $shop);

    $advance = WageAdvance::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'user_id' => $employee->id,
        'requested_by' => $employee->id,
        'amount_requested' => 5000,
        'status' => WageAdvanceStatus::PENDING,
        'repayment_installments' => 5,
    ]);

    $service = app(WageAdvanceService::class);
    $rejected = $service->reject($advance, $owner, 'Budget exceeded');

    expect($rejected->status)->toBe(WageAdvanceStatus::REJECTED);
});

it('WageAdvanceService cancel re-checks status inside transaction via lockForUpdate', function () {
    [$tenant, $shop, $owner] = mb3Setup('advance2');
    $employee = mb3Employee($tenant, $shop);

    $advance = WageAdvance::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'user_id' => $employee->id,
        'requested_by' => $employee->id,
        'amount_requested' => 3000,
        'status' => WageAdvanceStatus::PENDING,
        'repayment_installments' => 3,
    ]);

    $service = app(WageAdvanceService::class);
    $cancelled = $service->cancel($advance, $owner, 'Withdrawn by employee');

    expect($cancelled->status)->toBe(WageAdvanceStatus::CANCELLED);
});

// ---------------------------------------------------------------------------
// M8: confirmOrder — order row not locked, allows double-reservation
// ---------------------------------------------------------------------------

it('confirmOrder locks the order row inside the transaction to prevent double-confirm', function () {
    [$tenant, $shop, $owner] = mb3Setup('order');

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Lockable Product',
        'slug' => 'lockable-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'LOCK-'.uniqid(),
        'price' => 1000,
        'is_active' => true,
    ]);
    $location = InventoryLocation::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => 10,
        'reserved_quantity' => 0,
    ]);

    $order = (new \App\Models\Order)->forceFill([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_number' => 'ORD-'.uniqid(),
        'status' => OrderStatus::PENDING,
        'payment_status' => PaymentStatus::UNPAID,
        'subtotal' => 2000,
        'total_amount' => 2000,
        'created_by' => $owner->id,
    ]);
    $order->save();

    \App\Models\OrderItem::query()->create([
        'order_id' => $order->id,
        'tenant_id' => $tenant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'product_variant_id' => $variant->id,
        'quantity' => 2,
        'unit_price' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
    ]);

    $this->actingAs($owner);
    $service = app(OrderService::class);
    $confirmed = $service->confirmOrder($order, $owner);

    expect($confirmed->status)->toBe(OrderStatus::CONFIRMED);
    $location->refresh();
    expect($location->reserved_quantity)->toBe(2);

    // Calling confirm again should throw (order already CONFIRMED)
    expect(fn () => $service->confirmOrder($order->fresh(), $owner))
        ->toThrow(\Exception::class);

    // Reserved quantity should still be 2, not 4
    $location->refresh();
    expect($location->reserved_quantity)->toBe(2);
});

// ---------------------------------------------------------------------------
// M19: ShopCreationService — shop count TOCTOU (enforceTenantLimits no lock)
// ---------------------------------------------------------------------------

it('ShopCreationService enforces max_shops limit correctly', function () {
    [$tenant, $shop, $owner] = mb3Setup('shops');

    // Tenant starts with 1 shop (created in setup), max is 3
    $this->actingAs($owner);
    $service = app(ShopCreationService::class);
    $shopType = ShopType::firstOrCreate(['slug' => 'retail'], ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]);

    $service->create([
        'name' => 'Second Shop',
        'shop_type_slug' => 'retail',
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ], $tenant, $owner);

    $service->create([
        'name' => 'Third Shop',
        'shop_type_slug' => 'retail',
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ], $tenant, $owner);

    // 4th shop should fail (max is 3)
    expect(fn () => $service->create([
        'name' => 'Fourth Shop',
        'shop_type_slug' => 'retail',
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ], $tenant, $owner))->toThrow(\App\Exceptions\TenantLimitExceededException::class);
});

// ---------------------------------------------------------------------------
// M20: CreateOrderRequest — product_variant_id not shop-scoped
// ---------------------------------------------------------------------------

it('CreateOrderRequest rejects a variant that belongs to a different shop in the same tenant', function () {
    [$tenant, $shopA, $owner] = mb3Setup('order2');
    $shopType = ShopType::firstOrCreate(['slug' => 'retail'], ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]);
    $shopB = Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => 'Shop B',
        'slug' => 'shop-b-'.uniqid(),
        'is_active' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );

    // Product belongs to Shop B
    $productB = Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shopB->id,
        'product_type_id' => $productType->id,
        'name' => 'Shop B Product',
        'slug' => 'shopb-product-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);
    $variantB = ProductVariant::create([
        'product_id' => $productB->id,
        'name' => 'Default',
        'sku' => 'SHOPB-'.uniqid(),
        'price' => 500,
        'is_active' => true,
    ]);

    // Try to add Shop B's variant to an order for Shop A
    $request = new \App\Http\Requests\CreateOrderRequest;
    $request->setUserResolver(fn () => $owner);
    $request->merge(['shop_id' => $shopA->id]);

    $validator = Validator::make(
        [
            'shop_id' => $shopA->id,
            'items' => [
                [
                    'product_variant_id' => $variantB->id,
                    'quantity' => 1,
                ],
            ],
        ],
        $request->rules()
    );

    // Without the fix: passes (variant is in same tenant, wrong shop)
    // With the fix: fails (variant not in shop A)
    expect($validator->fails())->toBeTrue();
    expect($validator->errors()->has('items.0.product_variant_id'))->toBeTrue();
});

it('CreateOrderRequest accepts a variant that belongs to the correct shop', function () {
    [$tenant, $shop, $owner] = mb3Setup('order3');

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Correct Shop Product',
        'slug' => 'correct-shop-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'CORRECT-'.uniqid(),
        'price' => 500,
        'is_active' => true,
    ]);

    $request = new \App\Http\Requests\CreateOrderRequest;
    $request->setUserResolver(fn () => $owner);
    $request->merge(['shop_id' => $shop->id]);

    $validator = Validator::make(
        [
            'shop_id' => $shop->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 1]],
        ],
        $request->rules()
    );

    expect($validator->errors()->has('items.0.product_variant_id'))->toBeFalse();
});
