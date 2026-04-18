<?php

use App\Enums\UserRole;
use App\Models\FundRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

uses(RefreshDatabase::class);

it('allows a cashier to create a fund request via policy', function () {
    $cashier = User::factory()->create(['role' => UserRole::CASHIER]);

    expect(Gate::forUser($cashier)->allows('create', FundRequest::class))->toBeTrue();
});

it('allows the owner to create a fund request via policy', function () {
    $owner = User::factory()->create(['role' => UserRole::OWNER]);

    expect(Gate::forUser($owner)->allows('create', FundRequest::class))->toBeTrue();
});

it('allows a sales rep to create a fund request via policy', function () {
    $rep = User::factory()->create(['role' => UserRole::SALES_REP]);

    expect(Gate::forUser($rep)->allows('create', FundRequest::class))->toBeTrue();
});
