<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OrderReturnService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// ── Shared helpers ───────────────────────────────────────────────────────────

function returnScaffold(): array
{
    $shopType = ShopType::query()->firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );

    $tenant = Tenant::query()->create([
        'name' => fake()->company(),
        'slug' => fake()->unique()->slug(),
        'owner_email' => fake()->unique()->safeEmail(),
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $shop = Shop::query()->create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => 'Test Shop',
        'slug' => fake()->unique()->slug(),
        'is_active' => true,
        'storefront_enabled' => false,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
        'vat_enabled' => false,
        'vat_rate' => 0,
    ]);

    $owner = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::OWNER,
        'is_tenant_owner' => true,
    ]);

    $manager = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::GENERAL_MANAGER,
        'is_tenant_owner' => false,
    ]);

    $cashier = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::CASHIER,
        'is_tenant_owner' => false,
    ]);

    // Delivered order with one item (quantity=5)
    $order = Order::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_number' => 'ORD-TEST-'.fake()->unique()->numerify('####'),
        'order_type' => OrderType::POS->value,
        'status' => OrderStatus::DELIVERED->value,
        'payment_status' => PaymentStatus::PAID->value,
        'subtotal' => 5000,
        'total_amount' => 5000,
    ]);

    $orderItem = DB::table('order_items')->insertGetId([
        'order_id' => $order->id,
        'tenant_id' => $tenant->id,
        'quantity' => 5,
        'unit_price' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 5000,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return compact('tenant', 'shop', 'owner', 'manager', 'cashier', 'order', 'orderItem');
}

// ── Issue 10: Duplicate returns not prevented ─────────────────────────────────

it('createReturn rejects a second return when the combined quantity exceeds the ordered quantity', function () {
    ['owner' => $owner, 'order' => $order, 'orderItem' => $orderItemId] = returnScaffold();

    $service = app(OrderReturnService::class);

    // First return: 3 of 5 units — should succeed
    $service->createReturn(
        $order, $owner,
        [$orderItemId => ['quantity' => 3, 'reason' => 'Damaged']],
        'Quality issue'
    );

    // Second return: 3 more — total would be 6, exceeding the ordered 5
    expect(fn () => $service->createReturn(
        $order, $owner,
        [$orderItemId => ['quantity' => 3, 'reason' => 'Wrong item']],
        'Wrong item'
    ))->toThrow(\Exception::class);
});

// ── Issue 11: store() uses 'view' gate instead of return-specific gate ────────

it('store returns 403 for a cashier even when they can view the order', function () {
    ['tenant' => $tenant, 'shop' => $shop, 'cashier' => $cashier, 'order' => $order, 'orderItem' => $orderItemId] = returnScaffold();

    // Cashier is assigned to the shop so they CAN view the order — but should NOT be able to create a return.
    $shop->users()->attach($cashier->id, ['tenant_id' => $tenant->id]);

    $this->actingAs($cashier)
        ->postJson(route('orders.return.store', $order), [
            'reason' => 'Defective',
            'items' => [
                ['order_item_id' => $orderItemId, 'quantity' => 1],
            ],
        ])
        ->assertForbidden();
});

// ── Issue 12: index() has no authorization check ──────────────────────────────

it('returns index returns 403 for a cashier', function () {
    ['cashier' => $cashier] = returnScaffold();

    $this->actingAs($cashier)
        ->get(route('returns.index'))
        ->assertForbidden();
});

it('returns index returns 200 for an owner', function () {
    ['owner' => $owner] = returnScaffold();

    $this->actingAs($owner)
        ->get(route('returns.index'))
        ->assertOk();
});

// ── Issue 13: approve/reject/complete use inline validation ───────────────────

it('approve returns 422 when restock_items is not a boolean', function () {
    ['owner' => $owner, 'order' => $order, 'orderItem' => $orderItemId] = returnScaffold();

    $return = OrderReturn::query()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'return_number' => 'RET-'.strtoupper(uniqid()),
        'status' => 'pending',
        'reason' => 'Defective',
        'created_by' => $owner->id,
    ]);

    $this->actingAs($owner)
        ->postJson(route('returns.approve', $return), [
            'restock_items' => 'not-a-boolean',
        ])
        ->assertUnprocessable();
});

it('reject returns 422 when rejection_reason exceeds 1000 characters', function () {
    ['owner' => $owner, 'order' => $order] = returnScaffold();

    $return = OrderReturn::query()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'return_number' => 'RET-'.strtoupper(uniqid()),
        'status' => 'pending',
        'reason' => 'Defective',
        'created_by' => $owner->id,
    ]);

    $this->actingAs($owner)
        ->postJson(route('returns.reject', $return), [
            'rejection_reason' => str_repeat('a', 1001),
        ])
        ->assertUnprocessable();
});

it('a cashier cannot approve a return', function () {
    ['cashier' => $cashier, 'owner' => $owner, 'order' => $order] = returnScaffold();

    $return = OrderReturn::query()->create([
        'tenant_id' => $owner->tenant_id,
        'order_id' => $order->id,
        'return_number' => 'RET-'.strtoupper(uniqid()),
        'status' => 'pending',
        'reason' => 'Defective',
        'created_by' => $owner->id,
    ]);

    $this->actingAs($cashier)
        ->post(route('returns.approve', $return))
        ->assertForbidden();
});
