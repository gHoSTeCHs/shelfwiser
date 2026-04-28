<?php

namespace App\Services;

use App\Enums\PayType;
use App\Enums\WageAdvanceStatus;
use App\Models\Shop;
use App\Models\User;
use App\Models\WageAdvance;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class WageAdvanceService
{
    public function __construct(
        private EmployeePayrollService $payrollService,
        private NotificationService $notificationService
    ) {}

    /**
     * Calculate wage advance eligibility for an employee
     */
    public function calculateEligibility(User $employee, Shop $shop): array
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (! $payrollDetail) {
            return [
                'eligible' => false,
                'reason' => 'No payroll details configured',
                'max_amount' => 0,
                'percentage_allowed' => 0,
            ];
        }

        $taxSettings = $shop->taxSettings;
        $maxPercentage = $taxSettings ? (float) $taxSettings->wage_advance_max_percentage : 30.0;

        $activeAdvances = WageAdvance::forUser($employee->id)
            ->active()
            ->sum('amount_approved');

        $estimatedMonthlyPay = match ($payrollDetail->pay_type) {
            PayType::SALARY => (float) $payrollDetail->pay_amount,
            PayType::HOURLY => (float) $payrollDetail->pay_amount * 160,
            PayType::DAILY => (float) $payrollDetail->pay_amount * 22,
            default => 0,
        };

        $maxAdvanceAmount = ($estimatedMonthlyPay * $maxPercentage) / 100;
        $availableAmount = max(0, $maxAdvanceAmount - $activeAdvances);

        return [
            'eligible' => $availableAmount > 0,
            'reason' => $availableAmount > 0 ? null : 'Maximum advance limit reached',
            'max_amount' => $maxAdvanceAmount,
            'available_amount' => $availableAmount,
            'percentage_allowed' => $maxPercentage,
            'active_advances' => $activeAdvances,
            'estimated_monthly_pay' => $estimatedMonthlyPay,
        ];
    }

    /**
     * Create a wage advance request
     */
    public function create(User $user, int $shopId, array $data): WageAdvance
    {
        $shop = Shop::query()->findOrFail($shopId);

        return DB::transaction(function () use ($user, $shop, $shopId, $data) {
            // Serialize concurrent advance requests for this user so we can re-check
            // eligibility under a lock and prevent two requests from both passing the cap.
            User::query()->whereKey($user->id)->lockForUpdate()->first();

            $eligibility = $this->calculateEligibility($user, $shop);

            if (! $eligibility['eligible']) {
                throw new \RuntimeException($eligibility['reason']);
            }

            if ($data['amount_requested'] > $eligibility['available_amount']) {
                throw new \RuntimeException("Requested amount exceeds available limit of {$eligibility['available_amount']}");
            }

            $wageAdvance = WageAdvance::query()->create([
                'user_id' => $user->id,
                'shop_id' => $shopId,
                'tenant_id' => $user->tenant_id,
                'amount_requested' => $data['amount_requested'],
                'reason' => $data['reason'] ?? null,
                'status' => WageAdvanceStatus::PENDING,
                'requested_at' => now(),
                'repayment_installments' => $data['repayment_installments'] ?? 1,
            ]);

            $this->clearCache($user->tenant_id);

            $freshAdvance = $wageAdvance->fresh(['user', 'shop']);

            $this->notificationService->notifyWageAdvanceRequested($freshAdvance);

            return $freshAdvance;
        });
    }

    /**
     * Update the reason on a wage advance
     */
    public function updateReason(WageAdvance $wageAdvance, ?string $reason): WageAdvance
    {
        $wageAdvance->update(['reason' => $reason]);

        $this->clearCache($wageAdvance->tenant_id);

        return $wageAdvance->fresh();
    }

    /**
     * Approve a wage advance request
     */
    public function approve(
        WageAdvance $wageAdvance,
        User $approver,
        ?float $amountApproved = null,
        ?int $installments = null,
        ?string $notes = null
    ): WageAdvance {
        $approvedAmount = $amountApproved ?? $wageAdvance->amount_requested;

        return DB::transaction(function () use ($wageAdvance, $approver, $approvedAmount, $installments, $notes) {
            $lockedAdvance = WageAdvance::query()->lockForUpdate()->find($wageAdvance->id);

            if (! $lockedAdvance->status->canApprove()) {
                throw new \RuntimeException('Wage advance cannot be approved in current status');
            }

            $lockedUser = User::query()->lockForUpdate()->find($lockedAdvance->user_id);

            $eligibility = $this->calculateEligibility($lockedUser, $lockedAdvance->shop);
            if ($approvedAmount > $eligibility['available_amount']) {
                throw new \RuntimeException('Approved amount exceeds available limit');
            }

            $lockedAdvance->update([
                'status' => WageAdvanceStatus::APPROVED,
                'amount_approved' => $approvedAmount,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'rejection_reason' => null,
                'repayment_installments' => $installments ?? $lockedAdvance->repayment_installments,
                'notes' => $notes ?? $lockedAdvance->notes,
            ]);

            $this->clearCache($lockedAdvance->tenant_id);

            $freshAdvance = $lockedAdvance->fresh(['user', 'shop', 'approvedBy']);

            $this->notificationService->notifyWageAdvanceApproved($freshAdvance, $approver);

            return $freshAdvance;
        });
    }

    /**
     * Reject a wage advance request
     */
    public function reject(WageAdvance $wageAdvance, User $rejector, string $reason): WageAdvance
    {
        return DB::transaction(function () use ($wageAdvance, $rejector, $reason) {
            $locked = WageAdvance::query()->lockForUpdate()->find($wageAdvance->id);

            if (! $locked->status->canReject()) {
                throw new \RuntimeException('Wage advance cannot be rejected in current status');
            }

            $locked->update([
                'status' => WageAdvanceStatus::REJECTED,
                'approved_by_user_id' => $rejector->id,
                'approved_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $this->clearCache($wageAdvance->tenant_id);

            $freshAdvance = $wageAdvance->fresh(['user', 'shop', 'approvedBy']);

            $this->notificationService->notifyWageAdvanceRejected($freshAdvance, $rejector, $reason);

            return $freshAdvance;
        });
    }

    /**
     * Disburse approved wage advance
     */
    public function disburse(
        WageAdvance $wageAdvance,
        User $disburser,
        ?string $repaymentStartDate = null,
        ?string $notes = null
    ): WageAdvance {
        if (! $wageAdvance->status->canDisburse()) {
            throw new \RuntimeException('Wage advance cannot be disbursed in current status');
        }

        $parsedRepaymentDate = $repaymentStartDate
            ? Carbon::parse($repaymentStartDate)
            : null;

        return DB::transaction(function () use ($wageAdvance, $disburser, $parsedRepaymentDate, $notes) {
            $wageAdvance->update([
                'status' => WageAdvanceStatus::DISBURSED,
                'disbursed_by_user_id' => $disburser->id,
                'disbursed_at' => now(),
                'repayment_start_date' => $parsedRepaymentDate ?? now()->addMonth()->startOfMonth(),
                'notes' => $notes ?? $wageAdvance->notes,
            ]);

            $this->clearCache($wageAdvance->tenant_id);

            $freshAdvance = $wageAdvance->fresh(['user', 'shop', 'approvedBy', 'disbursedBy']);

            $this->notificationService->notifyWageAdvanceDisbursed($freshAdvance);

            return $freshAdvance;
        });
    }

    /**
     * Record a repayment installment
     */
    public function recordRepayment(WageAdvance $wageAdvance, float $amount): WageAdvance
    {
        if (! $wageAdvance->status->canRecordRepayment()) {
            throw new \RuntimeException('Cannot record repayment for this wage advance');
        }

        if ($amount <= 0) {
            throw new \InvalidArgumentException('Repayment amount must be greater than zero');
        }

        return DB::transaction(function () use ($wageAdvance, $amount) {
            $approvedAmount = (float) ($wageAdvance->amount_approved ?? $wageAdvance->amount_requested);
            $remaining = max(0, $approvedAmount - (float) $wageAdvance->amount_repaid);
            $cappedAmount = min($amount, $remaining);

            if ($cappedAmount <= 0) {
                return $wageAdvance->fresh();
            }

            $newAmountRepaid = (float) $wageAdvance->amount_repaid + $cappedAmount;
            $fullyRepaid = $newAmountRepaid >= $approvedAmount;

            $wageAdvance->update([
                'amount_repaid' => $newAmountRepaid,
                'status' => $fullyRepaid ? WageAdvanceStatus::REPAID : WageAdvanceStatus::REPAYING,
                'fully_repaid_at' => $fullyRepaid ? now() : null,
            ]);

            $this->clearCache($wageAdvance->tenant_id);

            return $wageAdvance->fresh();
        });
    }

    /**
     * Cancel a wage advance
     */
    public function cancel(WageAdvance $wageAdvance, User $user, string $reason): WageAdvance
    {
        return DB::transaction(function () use ($wageAdvance, $user, $reason) {
            $locked = WageAdvance::query()->lockForUpdate()->find($wageAdvance->id);

            if (! $locked->status->canCancel()) {
                throw new \RuntimeException('Wage advance cannot be cancelled in current status');
            }

            $locked->update([
                'status' => WageAdvanceStatus::CANCELLED,
                'rejection_reason' => $reason,
                'notes' => ($locked->notes ? $locked->notes."\n\n" : '').
                          "Cancelled by {$user->name}: {$reason}",
            ]);

            $this->clearCache($wageAdvance->tenant_id);

            return $wageAdvance->fresh();
        });
    }

    /**
     * Get shops available for the approval queue filter UI
     */
    public function getShopsForApprovalQueue(User $user): \Illuminate\Database\Eloquent\Collection
    {
        if ($user->is_tenant_owner) {
            return Shop::query()
                ->where('tenant_id', $user->tenant_id)
                ->get(['id', 'name']);
        }

        return $user->shops;
    }

    /**
     * Get wage advances for approval
     */
    public function getAdvancesForApproval(User $manager, ?int $shopId = null): Collection
    {
        $query = WageAdvance::query()->where('tenant_id', $manager->tenant_id)
            ->where('status', WageAdvanceStatus::PENDING)
            ->with(['user.role', 'shop', 'approvedBy']);

        if ($shopId) {
            $query->where('shop_id', $shopId);
        } elseif (! $manager->is_tenant_owner) {
            $managerShopIds = $manager->shops()->pluck('shops.id');
            $query->whereIn('shop_id', $managerShopIds);
        }

        $advances = $query->orderBy('requested_at', 'asc')->get();

        return $advances->filter(function ($advance) use ($manager) {
            if ($manager->id === $advance->user_id) {
                return false;
            }

            if ($manager->is_tenant_owner) {
                return true;
            }

            return $manager->role->level() > $advance->user->role->level();
        });
    }

    /**
     * Get user's wage advances
     */
    public function getUserAdvances(
        User $user,
        ?WageAdvanceStatus $status = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): Collection {
        $query = WageAdvance::query()->where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->with(['shop', 'approvedBy', 'disbursedBy']);

        if ($status) {
            $query->where('status', $status);
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
     * Get active wage advances for payroll deduction
     */
    public function getActiveAdvancesForPayroll(User $employee, Carbon $payrollDate): Collection
    {
        return WageAdvance::query()->where('tenant_id', $employee->tenant_id)
            ->where('user_id', $employee->id)
            ->whereIn('status', [WageAdvanceStatus::DISBURSED, WageAdvanceStatus::REPAYING])
            ->where('repayment_start_date', '<=', $payrollDate)
            ->get();
    }

    /**
     * Get wage advance statistics
     */
    public function getStatistics(int $tenantId, ?Shop $shop = null, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $base = WageAdvance::query()->where('tenant_id', $tenantId);

        if ($shop) {
            $base->where('shop_id', $shop->id);
        }

        if ($startDate) {
            $base->where('requested_at', '>=', $startDate);
        }

        if ($endDate) {
            $base->where('requested_at', '<=', $endDate);
        }

        $statusCounts = (clone $base)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalDisbursed = (clone $base)
            ->whereIn('status', [WageAdvanceStatus::DISBURSED, WageAdvanceStatus::REPAYING, WageAdvanceStatus::REPAID])
            ->selectRaw('COALESCE(SUM(COALESCE(amount_approved, amount_requested)), 0) as total')
            ->value('total');

        $totalOutstanding = (clone $base)
            ->whereIn('status', [WageAdvanceStatus::DISBURSED, WageAdvanceStatus::REPAYING])
            ->selectRaw('COALESCE(SUM(COALESCE(amount_approved, amount_requested) - COALESCE(amount_repaid, 0)), 0) as total')
            ->value('total');

        return [
            'total_advances' => (int) $statusCounts->sum(),
            'pending_advances' => (int) $statusCounts->get(WageAdvanceStatus::PENDING->value, 0),
            'approved_advances' => (int) $statusCounts->get(WageAdvanceStatus::APPROVED->value, 0),
            'disbursed_advances' => (int) $statusCounts->get(WageAdvanceStatus::DISBURSED->value, 0),
            'repaying_advances' => (int) $statusCounts->get(WageAdvanceStatus::REPAYING->value, 0),
            'repaid_advances' => (int) $statusCounts->get(WageAdvanceStatus::REPAID->value, 0),
            'total_amount_requested' => (float) (clone $base)->sum('amount_requested'),
            'total_amount_approved' => (float) (clone $base)->whereNotNull('amount_approved')->sum('amount_approved'),
            'total_amount_disbursed' => (float) $totalDisbursed,
            'total_amount_outstanding' => (float) $totalOutstanding,
        ];
    }

    /**
     * Get the first shop assigned to a user, or null if none.
     */
    public function getUserPrimaryShop(User $user): ?Shop
    {
        return $user->shops()->first();
    }

    /**
     * Delete a wage advance and clear related cache.
     */
    public function delete(WageAdvance $wageAdvance): void
    {
        $tenantId = $wageAdvance->tenant_id;
        $wageAdvance->delete();
        $this->clearCache($tenantId);
    }

    /**
     * Clear tenant cache
     */
    protected function clearCache(int $tenantId): void
    {
        Cache::tags([
            "tenant:{$tenantId}:wage_advances",
            "tenant:{$tenantId}:statistics",
        ])->flush();
    }
}
