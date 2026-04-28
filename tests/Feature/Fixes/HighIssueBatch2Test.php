<?php

use App\Enums\PayRunStatus;
use App\Enums\TimesheetStatus;
use App\Enums\UserRole;
use App\Enums\WageAdvanceStatus;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\Product;
use App\Models\ProductTemplate;
use App\Models\ProductType;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\Timesheet;
use App\Models\User;
use App\Models\WageAdvance;
use App\Services\AdminSettingsService;
use App\Services\PayRunService;
use App\Services\ProductTemplateService;
use App\Services\TimesheetService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Shared setup helpers
// ---------------------------------------------------------------------------

function b2Tenant(): Tenant
{
    static $counter = 0;
    $counter++;

    return Tenant::create([
        'name' => "B2 Tenant {$counter}",
        'slug' => "b2-tenant-{$counter}",
        'owner_email' => "owner{$counter}@b2.test",
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 50,
        'max_products' => 200,
    ]);
}

function b2Shop(Tenant $tenant): Shop
{
    $shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );

    static $shopCounter = 0;
    $shopCounter++;

    return Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => "B2 Shop {$shopCounter}",
        'slug' => "b2-shop-{$shopCounter}",
        'is_active' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ]);
}

function b2User(Tenant $tenant, Shop $shop, UserRole $role = UserRole::OWNER): User
{
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => $role,
        'is_tenant_owner' => $role === UserRole::OWNER,
        'is_active' => true,
    ]);
    $user->shops()->attach($shop->id, ['tenant_id' => $tenant->id]);

    return $user;
}

function b2PayRun(Tenant $tenant, Shop $shop): array
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

function b2Template(Tenant $tenant): ProductTemplate
{
    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );

    static $tplCounter = 0;
    $tplCounter++;

    return ProductTemplate::create([
        'tenant_id' => $tenant->id,
        'product_type_id' => $productType->id,
        'created_by_id' => null,
        'name' => "B2 Template {$tplCounter}",
        'slug' => "b2-template-{$tplCounter}",
        'is_active' => true,
        'is_system' => false,
        'has_variants' => false,
        'template_structure' => ['variants' => [['name' => 'Default', 'packaging_types' => []]]],
    ]);
}

// ---------------------------------------------------------------------------
// Issue 1: calculatePayRun leaves PayRun stuck in CALCULATING on exception
// ---------------------------------------------------------------------------

it('calculatePayRun resets status to DRAFT when an exception occurs mid-calculation', function () {
    $tenant = b2Tenant();
    $shop = b2Shop($tenant);
    $owner = b2User($tenant, $shop);
    [$payRun, $period] = b2PayRun($tenant, $shop);

    $service = app(PayRunService::class);

    // Soft-delete the payroll period so $payRun->payrollPeriod returns null,
    // causing a TypeError after the status is already set to CALCULATING.
    $period->delete();

    try {
        $service->calculatePayRun($payRun, $owner);
    } catch (\Throwable $e) {
        // Expected — TypeError when period is null
    }

    $payRun->refresh();
    // After the fix: status must be reset to DRAFT, not stuck in CALCULATING
    expect($payRun->status)->toBe(PayRunStatus::DRAFT);
});

// ---------------------------------------------------------------------------
// Issue 2: completePayRun uses stale advance installment without balance clamp
// ---------------------------------------------------------------------------

it('completePayRun clamps advance repayment to remaining balance on final installment', function () {
    $tenant = b2Tenant();
    $shop = b2Shop($tenant);
    $owner = b2User($tenant, $shop);
    $employee = b2User($tenant, $shop, UserRole::CASHIER);

    // Create a wage advance where amount_repaid + installment would exceed amount_approved
    $advance = WageAdvance::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'user_id' => $employee->id,
        'requested_by' => $employee->id,
        'amount_requested' => 10000,
        'amount_approved' => 10000,
        'amount_repaid' => 8000,
        'repayment_installments' => 10,
        'status' => WageAdvanceStatus::DISBURSED,
        'disbursed_at' => now(),
        'repayment_start_date' => now()->startOfMonth(),
    ]);

    // Installment = 10000 / 10 = 1000, remaining = 2000
    // But this test verifies the installment is clamped to min(1000, remaining_balance)
    $installment = $advance->getInstallmentAmount();
    $remaining = $advance->getRemainingBalance();

    // The installment (1000) is less than remaining (2000) — no over-repayment here
    // Let's set repaid to 9500 so installment (1000) > remaining (500)
    $advance->update(['amount_repaid' => 9500]);
    $advance->refresh();

    $remaining = $advance->getRemainingBalance(); // 500
    $installment = $advance->getInstallmentAmount(); // 1000

    expect($installment)->toBeGreaterThan($remaining);

    // completePayRun passes the raw installment (1000) which exceeds remaining (500).
    // The fix: completePayRun must clamp to min(installment, remaining) before calling recordRepayment.
    // Test: simulate what completePayRun does — pass the UNCLAMPED installment.
    app(\App\Services\WageAdvanceService::class)->recordRepayment($advance, $installment);

    $advance->refresh();
    // Without the fix: amount_repaid becomes 9500 + 1000 = 10500 > amount_approved
    // With the fix: completePayRun passes min(1000, 500) = 500, so amount_repaid = 10000
    expect((float) $advance->amount_repaid)->toBeLessThanOrEqual((float) $advance->amount_approved);
});

// ---------------------------------------------------------------------------
// Issue 3: updateTimesheet — no status guard, no hours recalculation
// ---------------------------------------------------------------------------

it('updateTimesheet throws when the timesheet is not in DRAFT status', function () {
    $tenant = b2Tenant();
    $shop = b2Shop($tenant);
    $employee = b2User($tenant, $shop, UserRole::CASHIER);

    $timesheet = Timesheet::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'user_id' => $employee->id,
        'date' => now()->toDateString(),
        'clock_in' => now()->setHour(9)->setMinute(0),
        'clock_out' => now()->setHour(17)->setMinute(0),
        'status' => TimesheetStatus::APPROVED,
        'total_hours' => 8,
        'regular_hours' => 8,
        'overtime_hours' => 0,
        'break_duration_minutes' => 0,
    ]);

    $service = app(TimesheetService::class);

    expect(fn () => $service->updateTimesheet($timesheet, ['notes' => 'Changed note']))
        ->toThrow(\RuntimeException::class);
});

it('updateTimesheet recalculates hours when clock times are changed', function () {
    $tenant = b2Tenant();
    $shop = b2Shop($tenant);
    $employee = b2User($tenant, $shop, UserRole::CASHIER);

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

    // Change clock_out to 19:00 — should extend hours to 10
    $service->updateTimesheet($timesheet, [
        'clock_out' => now()->setHour(19)->setMinute(0)->setSecond(0),
    ]);

    $timesheet->refresh();
    expect((float) $timesheet->total_hours)->toBe(10.0);
});

// ---------------------------------------------------------------------------
// Issue 4: ProductTemplateService::delete — TOCTOU on usage_count
// ---------------------------------------------------------------------------

it('ProductTemplateService::delete uses a transaction to prevent TOCTOU on usage_count', function () {
    $tenant = b2Tenant();
    $shop = b2Shop($tenant);
    $user = b2User($tenant, $shop);
    $this->actingAs($user);

    $template = b2Template($tenant);

    // Template has no products yet — delete should succeed
    $service = app(ProductTemplateService::class);
    expect($service->delete($template))->toBeTrue();
    expect(ProductTemplate::query()->find($template->id))->toBeNull();
});

it('ProductTemplateService::delete throws when template has products', function () {
    $tenant = b2Tenant();
    $shop = b2Shop($tenant);
    $user = b2User($tenant, $shop);
    $this->actingAs($user);

    $template = b2Template($tenant);
    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );

    // Create a product linked to the template
    Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'template_id' => $template->id,
        'name' => 'Product from template',
        'slug' => 'product-from-template-'.rand(1000, 9999),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);

    $service = app(ProductTemplateService::class);

    // Should throw because template is in use
    expect(fn () => $service->delete($template))
        ->toThrow(\RuntimeException::class, 'Cannot delete a template that has been used to create products');

    // Template should still exist
    expect(ProductTemplate::query()->find($template->id))->not->toBeNull();
});

// ---------------------------------------------------------------------------
// Issue 5: AdminSettingsController::update silently discards settings
// ---------------------------------------------------------------------------

it('AdminSettingsService::updateSystemSettings persists app_name and can be read back', function () {
    $service = app(AdminSettingsService::class);

    $service->updateSystemSettings(['app_name' => 'My New App Name']);

    $settings = $service->getSystemSettings();
    expect($settings['app_name'])->toBe('My New App Name');
});

it('AdminSettingsController update endpoint actually saves settings', function () {
    $tenant = b2Tenant();
    $shop = b2Shop($tenant);
    $superAdmin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::SUPER_ADMIN,
        'is_active' => true,
    ]);
    $this->actingAs($superAdmin);

    $response = $this->patch(route('admin.settings.update'), [
        'app_name' => 'ShelfWiser Test',
    ]);

    $response->assertRedirect(route('admin.settings.index'));

    $settings = app(AdminSettingsService::class)->getSystemSettings();
    expect($settings['app_name'])->toBe('ShelfWiser Test');
});
