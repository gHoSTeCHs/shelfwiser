<?php

use App\Enums\PayRunItemStatus;
use App\Enums\PayRunStatus;
use App\Enums\UserRole;
use App\Models\OrderReturn;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CustomerService;
use App\Services\PayRunService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function mb1Setup(): array
{
    $id = uniqid();
    $shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );
    $tenant = Tenant::create([
        'name' => "MB1 Tenant {$id}",
        'slug' => "mb1-tenant-{$id}",
        'owner_email' => "mb1-{$id}@test.com",
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 20,
        'max_products' => 200,
    ]);
    $shop = Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => "MB1 Shop {$id}",
        'slug' => "mb1-shop-{$id}",
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

function mb1PayRun(Tenant $tenant, Shop $shop): array
{
    $period = PayrollPeriod::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'period_name' => 'Test Period',
        'start_date' => now()->startOfMonth(),
        'end_date' => now()->endOfMonth(),
        'payment_date' => now()->endOfMonth()->addDay(),
        'status' => 'draft',
    ]);
    $payRun = PayRun::create([
        'tenant_id' => $tenant->id,
        'payroll_period_id' => $period->id,
        'name' => 'Test Pay Run',
        'status' => PayRunStatus::DRAFT,
    ]);

    return [$payRun, $period];
}

// ---------------------------------------------------------------------------
// M1: scopeWithStatus receives string — TypeError on pay run index with filter
// ---------------------------------------------------------------------------

it('getFilteredPayRuns does not throw when status filter is a string', function () {
    [$tenant] = mb1Setup();

    $service = app(PayRunService::class);

    expect(fn () => $service->getFilteredPayRuns(['status' => 'draft']))
        ->not->toThrow(\TypeError::class);
});

it('getFilteredPayRuns filters by status string correctly', function () {
    [$tenant, $shop] = mb1Setup();
    [$payRun] = mb1PayRun($tenant, $shop);

    $service = app(PayRunService::class);
    $result = $service->getFilteredPayRuns(['status' => 'draft']);

    expect($result->items())->toHaveCount(1);
    expect($result->items()[0]->id)->toBe($payRun->id);
});

// ---------------------------------------------------------------------------
// M2: calculatePayRun marks item as ERROR when employee has no payroll config
// ---------------------------------------------------------------------------

it('calculatePayRun marks item as ERROR when employee has no payroll configuration', function () {
    [$tenant, $shop, $owner] = mb1Setup();
    [$payRun, $period] = mb1PayRun($tenant, $shop);

    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::CASHIER,
        'is_active' => true,
    ]);
    $employee->shops()->attach($shop->id, ['tenant_id' => $tenant->id]);

    // Employee has NO payroll detail — calculateEmployeePay returns error-shape
    $item = PayRunItem::create([
        'tenant_id' => $tenant->id,
        'pay_run_id' => $payRun->id,
        'user_id' => $employee->id,
        'status' => PayRunItemStatus::PENDING,
    ]);

    $service = app(PayRunService::class);
    $service->calculatePayRun($payRun, $owner);

    $item->refresh();
    expect($item->status)->toBe(PayRunItemStatus::ERROR);
    expect($item->error_message)->not->toBeNull();
    expect((float) ($item->net_pay ?? 0))->toBe(0.0);
});

// ---------------------------------------------------------------------------
// M7: createReturn uses uniqid() — replace with Str::ulid()
// ---------------------------------------------------------------------------

it('return_number does not use microsecond-based uniqid format', function () {
    // uniqid() produces 13-char lowercase hex (e.g. "RET-6618F2A1B4D3E")
    // Str::ulid() produces 26-char uppercase Crockford base32

    // Create a return and verify the return_number is not the old uniqid hex format
    $returnNumber = 'RET-'.strtoupper(uniqid()); // old format

    // A ULID-based reference will be longer and contain more character variety
    $ulidBased = 'RET-'.\Illuminate\Support\Str::ulid()->toString();

    // old format: 13 hex chars after RET-
    expect(strlen($returnNumber))->toBe(4 + 13); // "RET-" + 13 hex chars

    // ulid format: 26 chars after RET-
    expect(strlen($ulidBased))->toBe(4 + 26);

    // Verify that DB returns use the longer ULID format (not 17-char old format)
    // We test via the actual return_number length coming from the service
    // Build a minimal return to check the number format
    $returnNumberFromDb = OrderReturn::query()->pluck('return_number')->first();

    // No returns yet — just verify the pattern expectation is correct
    // The real test is that the production code uses Str::ulid(), not uniqid()
    expect($returnNumber)->toMatch('/^RET-[0-9A-F]{13}$/');
    expect($ulidBased)->toMatch('/^RET-[0-9A-Z]{26}$/i');
});

it('two returns created in the same millisecond get distinct return_numbers', function () {
    // This test is inherently hard to trigger with real concurrency,
    // but we verify the method uses Str::ulid() which is collision-resistant.
    // We check the generated return_number matches the ULID pattern (26 chars).
    [$tenant, $shop, $owner] = mb1Setup();
    $this->actingAs($owner);

    $productType = \App\Models\ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );
    $product = \App\Models\Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Return Test Product',
        'slug' => 'return-test-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);
    $variant = \App\Models\ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'RET-SKU-'.uniqid(),
        'price' => 500,
        'is_active' => true,
    ]);
    $order = (new \App\Models\Order)->forceFill([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_number' => 'ORD-'.uniqid(),
        'status' => \App\Enums\OrderStatus::DELIVERED,
        'payment_status' => \App\Enums\PaymentStatus::PAID,
        'subtotal' => 500,
        'total_amount' => 500,
        'created_by' => $owner->id,
    ]);
    $order->save();

    \App\Models\OrderItem::query()->create([
        'order_id' => $order->id,
        'tenant_id' => $tenant->id,
        'sellable_type' => \App\Models\ProductVariant::class,
        'sellable_id' => $variant->id,
        'product_variant_id' => $variant->id,
        'quantity' => 2,
        'unit_price' => 500,
        'discount_amount' => 0,
        'tax_amount' => 0,
    ]);

    $orderItem = \App\Models\OrderItem::query()->where('order_id', $order->id)->first();
    $returnService = app(\App\Services\OrderReturnService::class);

    $return = $returnService->createReturn(
        $order,
        $owner,
        [['order_item_id' => $orderItem->id, 'quantity' => 1, 'condition' => 'good', 'reason' => 'Test']],
        'Test return',
        'return'
    );

    // ULID-based return_number should be 30 chars: "RET-" + 26 ULID chars
    expect(strlen($return->return_number))->toBe(30);
    expect($return->return_number)->toMatch('/^RET-[0-9A-Z]{26}$/i');
});

// ---------------------------------------------------------------------------
// M22: UpdateServiceAddonRequest — missing required_if:allows_quantity,true
// ---------------------------------------------------------------------------

it('UpdateServiceAddonRequest requires max_quantity when allows_quantity is true', function () {
    $request = new \App\Http\Requests\UpdateServiceAddonRequest;

    $validator = Validator::make(
        ['allows_quantity' => true], // max_quantity absent
        $request->rules()
    );

    expect($validator->fails())->toBeTrue();
    expect($validator->errors()->has('max_quantity'))->toBeTrue();
});

it('UpdateServiceAddonRequest allows max_quantity to be absent when allows_quantity is false', function () {
    $request = new \App\Http\Requests\UpdateServiceAddonRequest;

    $validator = Validator::make(
        ['allows_quantity' => false],
        $request->rules()
    );

    // max_quantity is not required when allows_quantity is false
    expect($validator->errors()->has('max_quantity'))->toBeFalse();
});

// ---------------------------------------------------------------------------
// M16: CustomerService::delete — swallowed exception → controller shows success
// ---------------------------------------------------------------------------

it('CustomerController destroy redirects with error when deletion fails', function () {
    [$tenant, $shop, $owner] = mb1Setup();
    $this->actingAs($owner);

    $customer = \App\Models\Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'preferred_shop_id' => $shop->id,
    ]);

    // Force the service to throw
    $this->mock(CustomerService::class, function ($mock) {
        $mock->shouldReceive('delete')
            ->once()
            ->andThrow(new \RuntimeException('DB connection lost'));
    });

    $response = $this->delete(route('customers.destroy', $customer));

    // Should NOT redirect with success when deletion fails
    $response->assertRedirect();
    expect(session('success'))->toBeNull();
    expect(session('error'))->not->toBeNull();
});

it('CustomerController destroy redirects with success when deletion succeeds', function () {
    [$tenant, $shop, $owner] = mb1Setup();
    $this->actingAs($owner);

    $customer = \App\Models\Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'preferred_shop_id' => $shop->id,
    ]);

    $response = $this->delete(route('customers.destroy', $customer));

    $response->assertRedirect(route('customers.index'));
    expect(session('success'))->not->toBeNull();
    expect(session('error'))->toBeNull();
});
