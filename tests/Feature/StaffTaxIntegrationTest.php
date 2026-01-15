<?php

use App\Enums\UserRole;
use App\Models\EmployeeTaxSetting;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\StaffOnboardingService;
use Illuminate\Database\Eloquent\Model;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Model::unguard();

    $this->tenant = Tenant::create([
        'name' => 'Test Tenant',
        'slug' => 'test-tenant',
        'owner_email' => 'owner@test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $this->shopType = ShopType::create([
        'label' => 'Retail',
        'slug' => 'retail',
        'description' => 'General retail store',
        'config_schema' => [],
        'is_active' => true,
    ]);

    $this->shop = Shop::create([
        'tenant_id' => $this->tenant->id,
        'shop_type_id' => $this->shopType->id,
        'name' => 'Test Shop',
        'slug' => 'test-shop',
        'config' => [],
        'is_active' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
    ]);

    Model::reguard();

    $this->owner = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'role' => UserRole::OWNER,
        'is_tenant_owner' => true,
        'is_active' => true,
    ]);

    $this->owner->shops()->attach($this->shop->id, ['tenant_id' => $this->tenant->id]);

    $this->onboardingService = app(StaffOnboardingService::class);

    $this->validStaffData = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john.doe@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'cashier',
        'shop_ids' => [$this->shop->id],
        'employment_type' => 'full_time',
        'position_title' => 'Cashier',
        'start_date' => now()->toDateString(),
        'pay_type' => 'salary',
        'pay_amount' => 500000,
        'pay_frequency' => 'monthly',
        'tax_handling' => 'shop_calculates',
        'pension_enabled' => true,
        'pension_employee_rate' => 8,
        'nhf_enabled' => false,
        'nhis_enabled' => false,
        'send_invitation' => false,
    ];
});

test('creates employee tax settings during staff onboarding', function () {
    $staff = $this->onboardingService->createStaffWithPayroll(
        $this->validStaffData,
        $this->tenant,
        $this->owner
    );

    expect($staff->taxSettings)->not->toBeNull();
    expect($staff->taxSettings)->toBeInstanceOf(EmployeeTaxSetting::class);
    expect($staff->taxSettings->user_id)->toBe($staff->id);
    expect($staff->taxSettings->tenant_id)->toBe($this->tenant->id);
});

test('employee tax settings have correct default values', function () {
    $staff = $this->onboardingService->createStaffWithPayroll(
        $this->validStaffData,
        $this->tenant,
        $this->owner
    );

    $taxSettings = $staff->taxSettings;

    expect($taxSettings->is_tax_exempt)->toBeFalse();
    expect($taxSettings->is_homeowner)->toBeFalse();
    expect($taxSettings->annual_rent_paid)->toBeNull();
    expect($taxSettings->active_reliefs)->toBeArray();
    expect($taxSettings->active_reliefs)->toBeEmpty();
    expect($taxSettings->low_income_auto_exempt)->toBeFalse();
});

test('accepts tax_id_number during staff creation', function () {
    $staffData = array_merge($this->validStaffData, [
        'tax_id_number' => 'TIN-12345678',
    ]);

    $staff = $this->onboardingService->createStaffWithPayroll(
        $staffData,
        $this->tenant,
        $this->owner
    );

    expect($staff->taxSettings->tax_id_number)->toBe('TIN-12345678');
});

test('accepts tax_state during staff creation', function () {
    $staffData = array_merge($this->validStaffData, [
        'tax_state' => 'Lagos',
    ]);

    $staff = $this->onboardingService->createStaffWithPayroll(
        $staffData,
        $this->tenant,
        $this->owner
    );

    expect($staff->taxSettings->tax_state)->toBe('Lagos');
});

test('accepts is_homeowner during staff creation', function () {
    $staffData = array_merge($this->validStaffData, [
        'is_homeowner' => true,
    ]);

    $staff = $this->onboardingService->createStaffWithPayroll(
        $staffData,
        $this->tenant,
        $this->owner
    );

    expect($staff->taxSettings->is_homeowner)->toBeTrue();
});

test('updates tax settings when updating staff', function () {
    $staff = $this->onboardingService->createStaffWithPayroll(
        $this->validStaffData,
        $this->tenant,
        $this->owner
    );

    expect($staff->taxSettings->is_homeowner)->toBeFalse();
    expect($staff->taxSettings->tax_state)->toBeNull();

    $updatedStaff = $this->onboardingService->updateStaffWithPayroll($staff, [
        'is_homeowner' => true,
        'tax_state' => 'Abuja',
        'tax_id_number' => 'TIN-87654321',
    ]);

    $updatedStaff->refresh();

    expect($updatedStaff->taxSettings->is_homeowner)->toBeTrue();
    expect($updatedStaff->taxSettings->tax_state)->toBe('Abuja');
    expect($updatedStaff->taxSettings->tax_id_number)->toBe('TIN-87654321');
});

test('creates tax settings during update if they do not exist', function () {
    $staff = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'role' => UserRole::CASHIER,
        'is_active' => true,
    ]);

    expect($staff->taxSettings)->toBeNull();

    $this->onboardingService->updateStaffWithPayroll($staff, [
        'is_homeowner' => true,
        'tax_state' => 'Kano',
    ]);

    $staff->refresh();

    expect($staff->taxSettings)->not->toBeNull();
    expect($staff->taxSettings->is_homeowner)->toBeTrue();
    expect($staff->taxSettings->tax_state)->toBe('Kano');
});

test('staff show page returns tax configuration status', function () {
    $staff = $this->onboardingService->createStaffWithPayroll(
        $this->validStaffData,
        $this->tenant,
        $this->owner
    );

    $response = $this->actingAs($this->owner)
        ->get(route('users.show', $staff));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('taxConfigurationStatus')
        ->where('taxConfigurationStatus.status', 'partial')
        ->where('taxConfigurationStatus.is_homeowner', false)
        ->where('taxConfigurationStatus.has_rent_proof', false)
    );
});

test('staff show page returns not_configured status when no tax settings', function () {
    $staff = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'role' => UserRole::CASHIER,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->owner)
        ->get(route('users.show', $staff));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('taxConfigurationStatus')
        ->where('taxConfigurationStatus.status', 'not_configured')
        ->where('taxConfigurationStatus.label', 'Not Configured')
        ->where('taxConfigurationStatus.color', 'warning')
    );
});

test('staff show page returns complete status when tax_id_number is set', function () {
    $staffData = array_merge($this->validStaffData, [
        'tax_id_number' => 'TIN-12345678',
    ]);

    $staff = $this->onboardingService->createStaffWithPayroll(
        $staffData,
        $this->tenant,
        $this->owner
    );

    $response = $this->actingAs($this->owner)
        ->get(route('users.show', $staff));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('taxConfigurationStatus')
        ->where('taxConfigurationStatus.status', 'complete')
        ->where('taxConfigurationStatus.label', 'Configured')
        ->where('taxConfigurationStatus.color', 'success')
    );
});

test('create staff request validates tax_state field', function () {
    $staffData = array_merge($this->validStaffData, [
        'tax_state' => str_repeat('a', 60),
    ]);

    $response = $this->actingAs($this->owner)
        ->post(route('users.store'), $staffData);

    $response->assertSessionHasErrors(['tax_state']);
});

test('create staff request validates is_homeowner as boolean', function () {
    $staffData = array_merge($this->validStaffData, [
        'is_homeowner' => 'not-a-boolean',
    ]);

    $response = $this->actingAs($this->owner)
        ->post(route('users.store'), $staffData);

    $response->assertSessionHasErrors(['is_homeowner']);
});

test('staff creation via controller creates tax settings', function () {
    $staffData = array_merge($this->validStaffData, [
        'tax_id_number' => 'TIN-CONTROLLER',
        'tax_state' => 'Rivers',
        'is_homeowner' => false,
    ]);

    $response = $this->actingAs($this->owner)
        ->post(route('users.store'), $staffData);

    $response->assertRedirect();

    $newStaff = User::where('email', 'john.doe@example.com')->first();

    expect($newStaff)->not->toBeNull();
    expect($newStaff->taxSettings)->not->toBeNull();
    expect($newStaff->taxSettings->tax_id_number)->toBe('TIN-CONTROLLER');
    expect($newStaff->taxSettings->tax_state)->toBe('Rivers');
    expect($newStaff->taxSettings->is_homeowner)->toBeFalse();
});

test('tax settings are loaded in staff relationships', function () {
    $staff = $this->onboardingService->createStaffWithPayroll(
        $this->validStaffData,
        $this->tenant,
        $this->owner
    );

    expect($staff->relationLoaded('taxSettings'))->toBeTrue();
});
