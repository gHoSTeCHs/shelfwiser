<?php

namespace App\Services;

use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
use App\Enums\UserRole;
use App\Models\FundRequest;
use App\Models\Shop;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class FundRequestService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function resolveShop(?int $shopId): ?Shop
    {
        if ($shopId === null) {
            return null;
        }

        return Shop::query()->findOrFail($shopId);
    }

    public function getStatusOptions(): array
    {
        return collect(FundRequestStatus::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->all();
    }

    public function getTypeOptions(): array
    {
        return collect(FundRequestType::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->all();
    }

    /**
     * Create a new fund request
     */
    public function create(User $user, Shop $shop, array $data): FundRequest
    {
        $freshRequest = DB::transaction(function () use ($user, $shop, $data) {
            $fundRequest = FundRequest::query()->create([
                'user_id' => $user->id,
                'shop_id' => $shop->id,
                'tenant_id' => $user->tenant_id,
                'request_type' => $data['request_type'],
                'amount' => $data['amount'],
                'description' => $data['description'],
                'status' => FundRequestStatus::PENDING,
                'requested_at' => now(),
            ]);

            $this->clearCache($user->tenant_id);

            return $fundRequest->fresh(['user', 'shop']);
        });

        $this->notificationService->notifyFundRequestSubmitted($freshRequest);

        return $freshRequest;
    }

    /**
     * Approve a fund request
     *
     * @throws \Throwable
     */
    public function approve(FundRequest $fundRequest, User $approver, ?string $notes = null): FundRequest
    {
        $freshRequest = DB::transaction(function () use ($fundRequest, $approver, $notes) {
            $locked = FundRequest::query()
                ->where('id', $fundRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $locked->status->canApprove()) {
                throw new \RuntimeException('Fund request cannot be approved in current status');
            }

            $locked->update([
                'status' => FundRequestStatus::APPROVED,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'rejection_reason' => null,
                'notes' => $notes ?? $locked->notes,
            ]);

            $this->clearCache($locked->tenant_id);

            return $locked->fresh(['user', 'shop', 'approvedBy']);
        });

        $this->notificationService->notifyFundRequestApproved($freshRequest, $approver);

        return $freshRequest;
    }

    /**
     * Reject a fund request
     *
     * @throws \Throwable
     */
    public function reject(FundRequest $fundRequest, User $rejector, string $reason): FundRequest
    {
        $freshRequest = DB::transaction(function () use ($fundRequest, $rejector, $reason) {
            $locked = FundRequest::query()
                ->where('id', $fundRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $locked->status->canReject()) {
                throw new \RuntimeException('Fund request cannot be rejected in current status');
            }

            $locked->update([
                'status' => FundRequestStatus::REJECTED,
                'rejected_by_user_id' => $rejector->id,
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $this->clearCache($locked->tenant_id);

            return $locked->fresh(['user', 'shop', 'approvedBy', 'rejectedBy']);
        });

        $this->notificationService->notifyFundRequestRejected($freshRequest, $rejector, $reason);

        return $freshRequest;
    }

    /**
     * Disburse approved funds
     */
    public function disburse(FundRequest $fundRequest, User $disburser, ?string $notes = null): FundRequest
    {
        $freshRequest = DB::transaction(function () use ($fundRequest, $disburser, $notes) {
            $locked = FundRequest::query()
                ->where('id', $fundRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $locked->status->canDisburse()) {
                throw new \RuntimeException('Fund request cannot be disbursed in current status');
            }

            $locked->update([
                'status' => FundRequestStatus::DISBURSED,
                'disbursed_by_user_id' => $disburser->id,
                'disbursed_at' => now(),
                'notes' => $notes ?? $locked->notes,
            ]);

            $this->clearCache($locked->tenant_id);

            return $locked->fresh(['user', 'shop', 'approvedBy', 'disbursedBy']);
        });

        $this->notificationService->notifyFundRequestDisbursed($freshRequest, $disburser);

        return $freshRequest;
    }

    /**
     * Cancel a fund request
     *
     * @throws \Throwable
     */
    public function cancel(FundRequest $fundRequest, User $user, string $reason): FundRequest
    {
        $freshRequest = DB::transaction(function () use ($fundRequest, $user, $reason) {
            $locked = FundRequest::query()
                ->where('id', $fundRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $locked->status->canCancel()) {
                throw new \RuntimeException('Fund request cannot be cancelled in current status');
            }

            $locked->update([
                'status' => FundRequestStatus::CANCELLED,
                'rejection_reason' => $reason,
                'notes' => ($locked->notes ? $locked->notes."\n\n" : '').
                    "Cancelled by {$user->name}: {$reason}",
            ]);

            $this->clearCache($locked->tenant_id);

            return $locked->fresh();
        });

        $this->notificationService->notifyFundRequestCancelled($freshRequest, $user);

        return $freshRequest;
    }

    /**
     * Mark receipt as uploaded
     */
    public function markReceiptUploaded(FundRequest $fundRequest): FundRequest
    {
        $fundRequest->update(['receipt_uploaded' => true]);

        $this->clearCache($fundRequest->tenant_id);

        return $fundRequest->fresh();
    }

    /**
     * Update fund request description
     */
    public function updateDescription(FundRequest $fundRequest, string $description): FundRequest
    {
        $fundRequest->update(['description' => $description]);

        $this->clearCache($fundRequest->tenant_id);

        return $fundRequest->fresh();
    }

    /**
     * Get fund requests for approval
     */
    public function getRequestsForApproval(User $manager, ?Shop $shop = null): Collection
    {
        $query = FundRequest::query()
            ->where('tenant_id', $manager->tenant_id)
            ->where('status', FundRequestStatus::PENDING)
            ->where('user_id', '!=', $manager->id)
            ->with(['user', 'shop', 'approvedBy']);

        if ($shop) {
            $query->where('shop_id', $shop->id);
        } elseif (! $manager->is_tenant_owner) {
            $managerShopIds = $manager->shops()->pluck('shops.id');
            $query->whereIn('shop_id', $managerShopIds);
        }

        $requests = $query->orderBy('requested_at', 'asc')->get();

        return $requests->filter(function ($request) use ($manager) {
            if ($manager->is_tenant_owner) {
                return true;
            }

            return $manager->role->level() > $request->user->role->level();
        });
    }

    /**
     * Get user's fund requests
     */
    public function getUserRequests(
        User $user,
        ?FundRequestStatus $status = null,
        ?Shop $shop = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        ?FundRequestType $type = null
    ): Collection {
        $query = FundRequest::query()->where('user_id', $user->id)
            ->with(['shop', 'approvedBy', 'disbursedBy']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($shop) {
            $query->where('shop_id', $shop->id);
        }

        if ($type) {
            $query->where('request_type', $type);
        }

        if ($startDate) {
            $query->where('requested_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('requested_at', '<=', $endDate);
        }

        return $query->orderBy('requested_at', 'desc')->get();
    }

    /**
     * Get shop fund requests (for managers)
     */
    public function getShopRequests(
        Shop $shop,
        ?FundRequestStatus $status = null,
        ?FundRequestType $type = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): Collection {
        $query = FundRequest::query()->where('shop_id', $shop->id)
            ->with(['user', 'approvedBy', 'disbursedBy']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($type) {
            $query->where('request_type', $type);
        }

        if ($startDate) {
            $query->where('requested_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('requested_at', '<=', $endDate);
        }

        return $query->orderBy('requested_at', 'desc')->get();
    }

    /**
     * Get fund request statistics
     */
    public function getStatistics(User $user, ?Shop $shop = null, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $base = FundRequest::query()->where('tenant_id', $user->tenant_id);

        if ($shop) {
            $base->where('shop_id', $shop->id);
        } elseif (! $user->is_tenant_owner && $user->role->level() < UserRole::GENERAL_MANAGER->level()) {
            $base->whereIn('shop_id', $user->shops->pluck('id'));
        }

        if ($startDate) {
            $base->where('requested_at', '>=', $startDate);
        }

        if ($endDate) {
            $base->where('requested_at', '<=', $endDate);
        }

        $byStatus = (clone $base)
            ->selectRaw('status, count(*) as total, sum(amount) as total_amount')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $byType = (clone $base)
            ->selectRaw('request_type, count(*) as total, sum(amount) as total_amount')
            ->groupBy('request_type')
            ->get();

        $pending = $byStatus->get(FundRequestStatus::PENDING->value);
        $approved = $byStatus->get(FundRequestStatus::APPROVED->value);
        $rejected = $byStatus->get(FundRequestStatus::REJECTED->value);
        $disbursed = $byStatus->get(FundRequestStatus::DISBURSED->value);

        return [
            'total_requests' => $byStatus->sum('total'),
            'pending_requests' => (int) ($pending?->total ?? 0),
            'approved_requests' => (int) ($approved?->total ?? 0),
            'rejected_requests' => (int) ($rejected?->total ?? 0),
            'disbursed_requests' => (int) ($disbursed?->total ?? 0),
            'total_amount_requested' => (float) $byStatus->sum('total_amount'),
            'total_amount_approved' => (float) (($approved?->total_amount ?? 0) + ($disbursed?->total_amount ?? 0)),
            'total_amount_disbursed' => (float) ($disbursed?->total_amount ?? 0),
            'by_type' => $byType->mapWithKeys(fn ($row) => [
                $row->request_type => [
                    'count' => (int) $row->total,
                    'total_amount' => (float) $row->total_amount,
                ],
            ])->toArray(),
        ];
    }

    public function delete(FundRequest $fundRequest): void
    {
        $tenantId = $fundRequest->tenant_id;
        $fundRequest->delete();
        $this->clearCache($tenantId);
    }

    /**
     * Clear tenant cache
     */
    protected function clearCache(int $tenantId): void
    {
        Cache::tags([
            "tenant:{$tenantId}:fund_requests",
            "tenant:{$tenantId}:statistics",
        ])->flush();
    }
}
