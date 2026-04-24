<?php

use App\Models\Customer;
use App\Models\Shop;
use App\Models\Tenant;
use App\Services\CustomerService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function customerAuthScaffold(): array
{
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'preferred_shop_id' => $shop->id,
        'is_active' => true,
        'account_balance' => 0,
    ]);

    return compact('tenant', 'shop', 'customer');
}

// === Issue 16: updateStorefrontProfile missing field allowlist ===

it('service blocks account_balance update via updateStorefrontProfile', function () {
    ['customer' => $customer] = customerAuthScaffold();
    $service = app(CustomerService::class);

    $service->updateStorefrontProfile($customer, [
        'first_name' => 'New',
        'last_name' => 'Name',
        'account_balance' => 99999.00,
    ]);

    expect((float) $customer->fresh()->account_balance)->toBe(0.0);
});

it('service blocks is_active update via updateStorefrontProfile', function () {
    ['customer' => $customer] = customerAuthScaffold();
    $service = app(CustomerService::class);

    $service->updateStorefrontProfile($customer, [
        'first_name' => 'New',
        'last_name' => 'Name',
        'is_active' => false,
    ]);

    expect($customer->fresh()->is_active)->toBeTrue();
});

it('service updates allowed fields via updateStorefrontProfile', function () {
    ['customer' => $customer] = customerAuthScaffold();
    $service = app(CustomerService::class);

    $result = $service->updateStorefrontProfile($customer, [
        'first_name' => 'Jane',
        'last_name' => 'Updated',
        'phone' => '+2348012345678',
        'marketing_opt_in' => true,
    ]);

    expect($result->first_name)->toBe('Jane')
        ->and($result->last_name)->toBe('Updated')
        ->and($result->phone)->toBe('+2348012345678')
        ->and($result->marketing_opt_in)->toBeTrue();
});

it('updateProfile endpoint delegates through service and blocks sensitive fields', function () {
    ['shop' => $shop, 'customer' => $customer] = customerAuthScaffold();

    $this->actingAs($customer, 'customer')
        ->patch(route('storefront.account.profile.update', $shop), [
            'first_name' => 'Jane',
            'last_name' => 'Done',
            'phone' => '+2348099999999',
        ])
        ->assertRedirect();

    expect($customer->fresh()->first_name)->toBe('Jane')
        ->and((float) $customer->fresh()->account_balance)->toBe(0.0);
});

// === Issue 17: Deactivated customers remain authenticated indefinitely ===

it('deactivated customer cannot access authenticated web routes', function () {
    ['shop' => $shop, 'customer' => $customer] = customerAuthScaffold();
    $customer->update(['is_active' => false]);

    $this->actingAs($customer, 'customer')
        ->get(route('storefront.account.dashboard', $shop))
        ->assertForbidden();
});

it('deactivated customer cannot access authenticated API profile update route', function () {
    ['shop' => $shop, 'customer' => $customer] = customerAuthScaffold();
    $customer->update(['is_active' => false]);

    $this->actingAs($customer, 'customer')
        ->patchJson("/store/{$shop->slug}/api/account/profile", [
            'first_name' => 'Hack',
            'last_name' => 'Attempt',
        ])
        ->assertForbidden();
});

it('active customer can successfully update their profile', function () {
    ['shop' => $shop, 'customer' => $customer] = customerAuthScaffold();

    $this->actingAs($customer, 'customer')
        ->patch(route('storefront.account.profile.update', $shop), [
            'first_name' => 'Valid',
            'last_name' => 'Update',
        ])
        ->assertRedirect();
});
