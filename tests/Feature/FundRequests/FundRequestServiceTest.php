<?php

declare(strict_types=1);

use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
use App\Enums\UserRole;
use App\Models\FundRequest;
use App\Models\Shop;
use App\Models\User;
use App\Services\FundRequestService;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

function fundRequestSetup(): array
{
    $owner = User::factory()->create(['role' => UserRole::OWNER, 'is_tenant_owner' => true]);
    $requester = User::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'role' => UserRole::CASHIER,
        'is_tenant_owner' => false,
    ]);
    $shop = Shop::factory()->create(['tenant_id' => $owner->tenant_id]);

    $fundRequest = FundRequest::query()->create([
        'user_id' => $requester->id,
        'shop_id' => $shop->id,
        'tenant_id' => $owner->tenant_id,
        'request_type' => FundRequestType::FUEL,
        'amount' => 5000.00,
        'description' => 'Fuel for generator',
        'status' => FundRequestStatus::PENDING,
        'requested_at' => now(),
    ]);

    return [$owner, $requester, $shop, $fundRequest];
}

// ──────────────────────────────────────────────────
// Issue 1: TOCTOU — guard must be re-read inside the transaction
// ──────────────────────────────────────────────────

it('approve rejects a stale pending model when the DB row was already approved', function () {
    $notifications = $this->mock(NotificationService::class);
    $notifications->shouldReceive('notifyFundRequestApproved')->never();

    [$owner, , , $fundRequest] = fundRequestSetup();

    // Simulate another concurrent request that got there first
    FundRequest::query()->where('id', $fundRequest->id)->update([
        'status' => FundRequestStatus::APPROVED,
    ]);

    // In-memory model is still stale (PENDING)
    expect($fundRequest->status)->toBe(FundRequestStatus::PENDING);

    expect(fn () => app(FundRequestService::class)->approve($fundRequest, $owner))
        ->toThrow(\RuntimeException::class, 'Fund request cannot be approved in current status');
});

it('reject rejects a stale pending model when the DB row was already rejected', function () {
    $notifications = $this->mock(NotificationService::class);
    $notifications->shouldReceive('notifyFundRequestRejected')->never();

    [$owner, , , $fundRequest] = fundRequestSetup();

    FundRequest::query()->where('id', $fundRequest->id)->update([
        'status' => FundRequestStatus::REJECTED,
    ]);

    expect($fundRequest->status)->toBe(FundRequestStatus::PENDING);

    expect(fn () => app(FundRequestService::class)->reject($fundRequest, $owner, 'Over budget'))
        ->toThrow(\RuntimeException::class, 'Fund request cannot be rejected in current status');
});

// ──────────────────────────────────────────────────
// Issue 2: reject() must not write to approval columns
// ──────────────────────────────────────────────────

it('reject records the rejector in rejected_by_user_id, not approved_by_user_id', function () {
    $notifications = $this->mock(NotificationService::class);
    $notifications->shouldReceive('notifyFundRequestRejected')->once();

    [$owner, , , $fundRequest] = fundRequestSetup();

    app(FundRequestService::class)->reject($fundRequest, $owner, 'Over budget');

    $fresh = $fundRequest->fresh();

    expect($fresh->rejected_by_user_id)->toBe($owner->id)
        ->and($fresh->rejected_at)->not->toBeNull()
        ->and($fresh->approved_by_user_id)->toBeNull()
        ->and($fresh->approved_at)->toBeNull();
});

// ──────────────────────────────────────────────────
// Issue 3: cancel() must fire a cancellation notification
// ──────────────────────────────────────────────────

it('cancel sends a cancellation notification after committing the transaction', function () {
    $notifications = $this->mock(NotificationService::class);
    $notifications->shouldReceive('notifyFundRequestCancelled')
        ->once()
        ->with(Mockery::type(FundRequest::class), Mockery::type(User::class));

    [$owner, , , $fundRequest] = fundRequestSetup();

    app(FundRequestService::class)->cancel($fundRequest, $owner, 'No longer needed');
});

// ──────────────────────────────────────────────────
// Issue 4: updateDescription() must clear the tenant cache
// ──────────────────────────────────────────────────

it('updateDescription clears the tenant fund request cache tags', function () {
    $this->mock(NotificationService::class);

    [$owner, , , $fundRequest] = fundRequestSetup();

    $tenantId = $fundRequest->tenant_id;
    $testKey = 'test_pending_list';

    Cache::tags(["tenant:{$tenantId}:fund_requests"])->put($testKey, 'cached-value', 60);

    expect(Cache::tags(["tenant:{$tenantId}:fund_requests"])->get($testKey))->toBe('cached-value');

    app(FundRequestService::class)->updateDescription($fundRequest, 'Updated description');

    expect(Cache::tags(["tenant:{$tenantId}:fund_requests"])->get($testKey))->toBeNull();
});
