<?php

use App\Enums\TimesheetStatus;
use App\Enums\UserRole;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\ServiceAddon;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\Timesheet;
use App\Models\User;
use App\Services\HeldSaleService;
use App\Services\ServiceManagementService;
use App\Services\ShopCreationService;
use App\Services\TimesheetService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function mb4Setup(string $suffix = ''): array
{
    $id = uniqid($suffix);
    $shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );
    $tenant = Tenant::create([
        'name' => "MB4 Tenant {$id}",
        'slug' => "mb4-{$id}",
        'owner_email' => "mb4-{$id}@test.com",
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 20,
        'max_products' => 200,
    ]);
    $shop = Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => "MB4 Shop {$id}",
        'slug' => "mb4-shop-{$id}",
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
// M21: RecordOrderPaymentRequest — balance check TOCTOU
// ---------------------------------------------------------------------------

it('OrderPaymentService recordPayment rejects amount exceeding remaining balance', function () {
    [$tenant, $shop, $owner] = mb4Setup('pay');
    $this->actingAs($owner);

    $order = (new \App\Models\Order)->forceFill([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_number' => 'ORD-'.uniqid(),
        'status' => \App\Enums\OrderStatus::CONFIRMED,
        'payment_status' => \App\Enums\PaymentStatus::UNPAID,
        'subtotal' => 5000,
        'total_amount' => 5000,
        'paid_amount' => 0,
        'created_by' => $owner->id,
    ]);
    $order->save();

    $service = app(\App\Services\OrderPaymentService::class);

    // Trying to pay more than total_amount should throw
    expect(fn () => $service->recordPayment($order, [
        'amount' => 6000, // exceeds 5000
        'payment_method' => 'cash',
        'payment_date' => now()->toDateString(),
    ], $owner->id))->toThrow(\Exception::class);
});

it('OrderPaymentService recordPayment accepts amount within remaining balance', function () {
    [$tenant, $shop, $owner] = mb4Setup('pay2');
    $this->actingAs($owner);

    $order = (new \App\Models\Order)->forceFill([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'order_number' => 'ORD-'.uniqid(),
        'status' => \App\Enums\OrderStatus::CONFIRMED,
        'payment_status' => \App\Enums\PaymentStatus::UNPAID,
        'subtotal' => 5000,
        'total_amount' => 5000,
        'paid_amount' => 0,
        'created_by' => $owner->id,
    ]);
    $order->save();

    $service = app(\App\Services\OrderPaymentService::class);

    $payment = $service->recordPayment($order, [
        'amount' => 3000,
        'payment_method' => 'cash',
        'payment_date' => now()->toDateString(),
    ], $owner->id);

    expect($payment)->not->toBeNull();
});

// ---------------------------------------------------------------------------
// M11: HeldSaleService::retrieveHeldSale — no reservation release
// ---------------------------------------------------------------------------

it('retrieveHeldSale releases reserved_quantity on inventory locations', function () {
    [$tenant, $shop, $owner] = mb4Setup('held');
    $this->actingAs($owner);

    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Held Product',
        'slug' => 'held-product-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'HELD-'.uniqid(),
        'price' => 500,
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

    $service = app(HeldSaleService::class);

    // Hold a sale (this reserves stock)
    $heldSale = $service->holdSale($owner, $shop, [
        ['variant_id' => $variant->id, 'quantity' => 3, 'unit_price' => 500],
    ]);

    $location->refresh();
    expect($location->reserved_quantity)->toBe(3);

    // Retrieve the held sale
    $service->retrieveHeldSale($heldSale, $owner);

    // After retrieval, reservation should be released
    $location->refresh();
    expect($location->reserved_quantity)->toBe(0);
});

// ---------------------------------------------------------------------------
// M18: ServiceManagementService — null dereference on orphaned addon
// ---------------------------------------------------------------------------

it('deleteAddon handles orphaned addon with null service_id and service_category_id gracefully', function () {
    [$tenant, $shop, $owner] = mb4Setup('svc');
    $this->actingAs($owner);

    // Create an orphaned addon with both FK as null
    $addon = ServiceAddon::create([
        'tenant_id' => $tenant->id,
        'service_id' => null,
        'service_category_id' => null,
        'name' => 'Orphaned Addon',
        'price' => 100,
        'is_active' => true,
        'allows_quantity' => false,
        'sort_order' => 0,
    ]);

    $service = app(ServiceManagementService::class);

    // Should not throw TypeError on null dereference
    expect(fn () => $service->deleteAddon($addon))->not->toThrow(\TypeError::class);
});

it('updateAddon handles orphaned addon with null FKs gracefully', function () {
    [$tenant, $shop, $owner] = mb4Setup('svc2');
    $this->actingAs($owner);

    $addon = ServiceAddon::create([
        'tenant_id' => $tenant->id,
        'service_id' => null,
        'service_category_id' => null,
        'name' => 'Orphaned Addon 2',
        'price' => 200,
        'is_active' => true,
        'allows_quantity' => false,
        'sort_order' => 0,
    ]);

    $service = app(ServiceManagementService::class);

    expect(fn () => $service->updateAddon($addon, ['name' => 'Updated Orphaned Addon']))
        ->not->toThrow(\TypeError::class);
});

// ---------------------------------------------------------------------------
// M24: ShopCreationService::generateUniqueSlug — race condition
// ---------------------------------------------------------------------------

it('ShopCreationService generates unique slugs when the same shop name is used twice', function () {
    [$tenant, $shop, $owner] = mb4Setup('shopslug');
    $this->actingAs($owner);

    $service = app(ShopCreationService::class);

    $shop1 = $service->create([
        'name' => 'My Corner Shop',
        'shop_type_slug' => 'retail',
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ], $tenant, $owner);

    $shop2 = $service->create([
        'name' => 'My Corner Shop',
        'shop_type_slug' => 'retail',
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ], $tenant, $owner);

    expect($shop1->slug)->not->toBe($shop2->slug);
    expect($shop1->slug)->toBe('my-corner-shop');
    expect($shop2->slug)->toBe('my-corner-shop-1');
});

// ---------------------------------------------------------------------------
// M4: TimesheetService::rejectTimesheet — uses canApprove() instead of canReject()
// ---------------------------------------------------------------------------

it('TimesheetStatus has a canReject method that controls rejection eligibility', function () {
    expect(TimesheetStatus::SUBMITTED->canReject())->toBeTrue();
    expect(TimesheetStatus::DRAFT->canReject())->toBeFalse();
    expect(TimesheetStatus::APPROVED->canReject())->toBeFalse();
    expect(TimesheetStatus::REJECTED->canReject())->toBeFalse();
    expect(TimesheetStatus::PAID->canReject())->toBeFalse();
});

it('rejectTimesheet uses canReject() guard not canApprove()', function () {
    [$tenant, $shop, $owner] = mb4Setup('ts');

    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::CASHIER,
        'is_active' => true,
    ]);

    $timesheet = Timesheet::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'user_id' => $employee->id,
        'date' => now()->toDateString(),
        'clock_in' => now()->setHour(9)->setMinute(0)->setSecond(0),
        'clock_out' => now()->setHour(17)->setMinute(0)->setSecond(0),
        'status' => TimesheetStatus::SUBMITTED,
        'total_hours' => 8,
        'regular_hours' => 8,
        'overtime_hours' => 0,
        'break_duration_minutes' => 0,
    ]);

    $service = app(TimesheetService::class);
    $rejected = $service->rejectTimesheet($timesheet, $owner, 'Invalid hours');

    expect($rejected->status)->toBe(TimesheetStatus::REJECTED);
});

it('rejectTimesheet throws when timesheet is in DRAFT status', function () {
    [$tenant, $shop, $owner] = mb4Setup('ts2');

    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::CASHIER,
        'is_active' => true,
    ]);

    $timesheet = Timesheet::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'user_id' => $employee->id,
        'date' => now()->toDateString(),
        'clock_in' => now()->setHour(9)->setMinute(0)->setSecond(0),
        'clock_out' => now()->setHour(17)->setMinute(0)->setSecond(0),
        'status' => TimesheetStatus::DRAFT,
        'total_hours' => 8,
        'regular_hours' => 8,
        'overtime_hours' => 0,
        'break_duration_minutes' => 0,
    ]);

    $service = app(TimesheetService::class);

    expect(fn () => $service->rejectTimesheet($timesheet, $owner, 'Not submitted'))
        ->toThrow(\RuntimeException::class);
});
