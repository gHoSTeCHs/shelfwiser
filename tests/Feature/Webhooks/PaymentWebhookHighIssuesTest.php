<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Webhooks\PaymentWebhookController;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// Helper: expose protected methods for testing via subclass
function makeTestWebhookController(): PaymentWebhookController
{
    return new class(app(\App\Services\Payment\PaymentGatewayManager::class)) extends PaymentWebhookController
    {
        public function exposeSuccessful(string $gateway, object $event): void
        {
            $this->handleSuccessfulPayment($gateway, $event);
        }

        public function exposeFailed(string $gateway, object $event): void
        {
            $this->handleFailedPayment($gateway, $event);
        }
    };
}

function makeWebhookOrder(float $total = 1000.0): Order
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
        'storefront_enabled' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
        'vat_enabled' => false,
        'vat_rate' => 0,
    ]);

    return Order::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_number' => 'ORD-WEBHOOK-'.fake()->unique()->numerify('####'),
        'order_type' => OrderType::CUSTOMER->value,
        'status' => OrderStatus::PENDING->value,
        'payment_status' => PaymentStatus::UNPAID->value,
        'payment_reference' => 'REF-'.fake()->unique()->numerify('########'),
        'subtotal' => $total,
        'total_amount' => $total,
    ]);
}

// ── Issue 14: underpayment logs but still creates an OrderPayment ─────────────

it('handleSuccessfulPayment does not record an OrderPayment when the amount is below 99% of the remaining balance', function () {
    $order = makeWebhookOrder(total: 1000.0);

    $event = (object) [
        'reference' => $order->payment_reference,
        'amount' => 800.0,   // 80% of 1000 — below 99% threshold
        'currency' => 'NGN',
        'gatewayFee' => 0,
        'gatewayReference' => 'GW-REF-001',
        'paidAt' => now()->toDateTimeString(),
        'type' => 'charge.success',
        'status' => 'success',
    ];

    makeTestWebhookController()->exposeSuccessful('paystack', $event);

    expect(OrderPayment::query()->where('reference_number', $order->payment_reference)->count())->toBe(0);
});

// ── Issue 15: handleFailedPayment runs outside a transaction ──────────────────

it('handleFailedPayment executes inside a database transaction', function () {
    $order = makeWebhookOrder();
    $ref = $order->payment_reference;

    $transactionStarted = false;

    DB::listen(function ($query) use (&$transactionStarted) {
        // In a nested context (RefreshDatabase holds level 1), DB::transaction()
        // inside handleFailedPayment creates a SAVEPOINT — level goes from 1 to 2.
        // We detect the first SELECT on order_payments (the idempotency check) and
        // confirm the transaction level at that point.
        if (str_contains(strtolower($query->sql), 'order_payments') && DB::transactionLevel() === 2) {
            $transactionStarted = true;
        }
    });

    $event = (object) [
        'reference' => $ref,
        'type' => 'charge.failed',
        'status' => 'failed',
        'amount' => 1000,
        'currency' => 'NGN',
        'gatewayFee' => 0,
        'gatewayReference' => 'GW-REF-FAIL',
        'paidAt' => null,
    ];

    makeTestWebhookController()->exposeFailed('paystack', $event);

    expect($transactionStarted)->toBeTrue();
});
