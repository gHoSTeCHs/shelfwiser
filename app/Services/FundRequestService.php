<?php

namespace App\Services;

use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
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

    /**
     * Create a new fund request
     */
    public function create(User $user, Shop $shop, array $data): FundRequest
    {
        return DB::transaction(function () use ($user, $shop, $data) {
            $fundRequest = FundRequest::create([
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

            $freshRequest = $fundRequest->fresh(['user', 'shop']);

            $this->notificationService->notifyFundRequestSubmitted($freshRequest);

            return $freshRequest;
        });
    }

    /**
     * Approve a fund request
     */
    public function approve(FundRequest $fundRequest, User $approver, ?string $notes = null): FundRequest
    {
        if (!$fundRequest->status->canApprove()) {
            throw new \RuntimeException('Fund request cannot be approved in current status');
        }

        return DB::transaction(function () use ($fundRequest, $approver, $notes) {
            $fundRequest->update([
                'status' => FundRequestStatus::APPROVED,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'rejection_reason' => null,
                'notes' => $notes ?? $fundRequest->notes,
            ]);

            $this->clearCache($fundRequest->tenant_id);

            $freshRequest = $fundRequest->fresh(['user', 'shop', 'approvedBy']);

            $this->notificationService->notifyFundRequestApproved($freshRequest, $approver);

            return $freshRequest;
        });
    }

    /**
     * Reject a fund request
     */
    public function reject(FundRequest $fundRequest, User $rejector, string $reason): FundRequest
    {
        if (!$fundRequest->status->canReject()) {
            throw new \RuntimeException('Fund request cannot be rejected in current status');
        }

        return DB::transaction(function () use ($fundRequest, $rejector, $reason) {
            $fundRequest->update([
                'status' => FundRequestStatus::REJECTED,
                'approved_by_user_id' => $rejector->id,
                'approved_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $this->clearCache($fundRequest->tenant_id);

            $freshRequest = $fundRequest->fresh(['user', 'shop', 'approvedBy']);

            $this->notificationService->notifyFundRequestRejected($freshRequest, $rejector, $reason);

            return $freshRequest;
        });
    }

    /**
     * Disburse approved funds
     */
    public function disburse(FundRequest $fundRequest, User $disburser, ?string $notes = null): FundRequest
    {
        if (!$fundRequest->status->canDisburse()) {
            throw new \RuntimeException('Fund request cannot be disbursed in current status');
        }

        return DB::transaction(function () use ($fundRequest, $disburser, $notes) {
            $fundRequest->update([
                'status' => FundRequestStatus::DISBURSED,
                'disbursed_by_user_id' => $disburser->id,
                'disbursed_at' => now(),
                'notes' => $notes ?? $fundRequest->notes,
            ]);

            $this->clearCache($fundRequest->tenant_id);

            $freshRequest = $fundRequest->fresh(['user', 'shop', 'approvedBy', 'disbursedBy']);

            $this->notificationService->notifyFundRequestDisbursed($freshRequest, $disburser);

            return $freshRequest;
        });
    }

    /**
     * Cancel a fund request
     */
    public function cancel(FundRequest $fundRequest, User $user, string $reason): FundRequest
    {
        if (!$fundRequest->status->canCancel()) {
            throw new \RuntimeException('Fund request cannot be cancelled in current status');
        }

        return DB::transaction(function () use ($fundRequest, $user, $reason) {
            $fundRequest->update([
                'status' => FundRequestStatus::CANCELLED,
                'rejection_reason' => $reason,
                'notes' => ($fundRequest->notes ? $fundRequest->notes . "\n\n" : '') .
                          "Cancelled by {$user->name}: {$reason}",
            ]);

            $this->clearCache($fundRequest->tenant_id);

            return $fundRequest->fresh();
        });
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
     * Get fund requests for approval
     */
    public function getRequestsForApproval(User $manager, ?Shop $shop = null): Collection
    {
        $query = FundRequest::where('tenant_id', $manager->tenant_id)
            ->where('status', FundRequestStatus::PENDING)
            ->with(['user', 'shop', 'approvedBy']);

        if ($shop) {
            $query->where('shop_id', $shop->id);
        } elseif (!$manager->is_tenant_owner) {
            $managerShopIds = $manager->shops()->pluck('shops.id');
            $query->whereIn('shop_id', $managerShopIds);
        }

        $requests = $query->orderBy('requested_at', 'asc')->get();

        return $requests->filter(function ($request) use ($manager) {
            if ($manager->id === $request->user_id) {
                return false;
            }

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
        ?Carbon $endDate = null
    ): Collection {
        $query = FundRequest::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->with(['shop', 'approvedBy', 'disbursedBy']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($shop) {
            $query->where('shop_id', $shop->id);
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
        $query = FundRequest::where('shop_id', $shop->id)
            ->where('tenant_id', $shop->tenant_id)
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
    public function getStatistics(int $tenantId, ?Shop $shop = null, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $query = FundRequest::where('tenant_id', $tenantId);

        if ($shop) {
            $query->where('shop_id', $shop->id);
        }

        if ($startDate) {
            $query->where('requested_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('requested_at', '<=', $endDate);
        }

        $all = $query->get();

        return [
            'total_requests' => $all->count(),
            'pending_requests' => $all->where('status', FundRequestStatus::PENDING)->count(),
            'approved_requests' => $all->where('status', FundRequestStatus::APPROVED)->count(),
            'rejected_requests' => $all->where('status', FundRequestStatus::REJECTED)->count(),
            'disbursed_requests' => $all->where('status', FundRequestStatus::DISBURSED)->count(),
            'total_amount_requested' => $all->sum('amount'),
            'total_amount_approved' => $all->whereIn('status', [
                FundRequestStatus::APPROVED,
                FundRequestStatus::DISBURSED,
            ])->sum('amount'),
            'total_amount_disbursed' => $all->where('status', FundRequestStatus::DISBURSED)->sum('amount'),
            'by_type' => $all->groupBy('request_type')->map(fn($items) => [
                'count' => $items->count(),
                'total_amount' => $items->sum('amount'),
            ])->toArray(),
        ];
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
