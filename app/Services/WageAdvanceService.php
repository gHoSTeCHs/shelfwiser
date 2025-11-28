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
    public function create(User $user, Shop $shop, array $data): WageAdvance
    {
        $eligibility = $this->calculateEligibility($user, $shop);

        if (! $eligibility['eligible']) {
            throw new \RuntimeException($eligibility['reason']);
        }

        if ($data['amount_requested'] > $eligibility['available_amount']) {
            throw new \RuntimeException("Requested amount exceeds available limit of {$eligibility['available_amount']}");
        }

        return DB::transaction(function () use ($user, $shop, $data) {
            $wageAdvance = WageAdvance::create([
                'user_id' => $user->id,
                'shop_id' => $shop->id,
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
     * Approve a wage advance request
     */
    public function approve(
        WageAdvance $wageAdvance,
        User $approver,
        ?float $amountApproved = null,
        ?int $installments = null,
        ?string $notes = null
    ): WageAdvance {
        if (! $wageAdvance->status->canApprove()) {
            throw new \RuntimeException('Wage advance cannot be approved in current status');
        }

        $approvedAmount = $amountApproved ?? $wageAdvance->amount_requested;

        $eligibility = $this->calculateEligibility($wageAdvance->user, $wageAdvance->shop);
        if ($approvedAmount > $eligibility['available_amount']) {
            throw new \RuntimeException('Approved amount exceeds available limit');
        }

        return DB::transaction(function () use ($wageAdvance, $approver, $approvedAmount, $installments, $notes) {
            $wageAdvance->update([
                'status' => WageAdvanceStatus::APPROVED,
                'amount_approved' => $approvedAmount,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'rejection_reason' => null,
                'repayment_installments' => $installments ?? $wageAdvance->repayment_installments,
                'notes' => $notes ?? $wageAdvance->notes,
            ]);

            $this->clearCache($wageAdvance->tenant_id);

            $freshAdvance = $wageAdvance->fresh(['user', 'shop', 'approvedBy']);

            $this->notificationService->notifyWageAdvanceApproved($freshAdvance, $approver);

            return $freshAdvance;
        });
    }

    /**
     * Reject a wage advance request
     */
    public function reject(WageAdvance $wageAdvance, User $rejector, string $reason): WageAdvance
    {
        if (! $wageAdvance->status->canReject()) {
            throw new \RuntimeException('Wage advance cannot be rejected in current status');
        }

        return DB::transaction(function () use ($wageAdvance, $rejector, $reason) {
            $wageAdvance->update([
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
        ?Carbon $repaymentStartDate = null,
        ?string $notes = null
    ): WageAdvance {
        if (! $wageAdvance->status->canDisburse()) {
            throw new \RuntimeException('Wage advance cannot be disbursed in current status');
        }

        return DB::transaction(function () use ($wageAdvance, $disburser, $repaymentStartDate, $notes) {
            $wageAdvance->update([
                'status' => WageAdvanceStatus::DISBURSED,
                'disbursed_by_user_id' => $disburser->id,
                'disbursed_at' => now(),
                'repayment_start_date' => $repaymentStartDate ?? now()->addMonth()->startOfMonth(),
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

        return DB::transaction(function () use ($wageAdvance, $amount) {
            $newAmountRepaid = (float) $wageAdvance->amount_repaid + $amount;
            $approvedAmount = (float) ($wageAdvance->amount_approved ?? $wageAdvance->amount_requested);

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
        if (! $wageAdvance->status->canCancel()) {
            throw new \RuntimeException('Wage advance cannot be cancelled in current status');
        }

        return DB::transaction(function () use ($wageAdvance, $user, $reason) {
            $wageAdvance->update([
                'status' => WageAdvanceStatus::CANCELLED,
                'rejection_reason' => $reason,
                'notes' => ($wageAdvance->notes ? $wageAdvance->notes."\n\n" : '').
                          "Cancelled by {$user->name}: {$reason}",
            ]);

            $this->clearCache($wageAdvance->tenant_id);

            return $wageAdvance->fresh();
        });
    }

    /**
     * Get wage advances for approval
     */
    public function getAdvancesForApproval(User $manager, ?Shop $shop = null): Collection
    {
        $query = WageAdvance::where('tenant_id', $manager->tenant_id)
            ->where('status', WageAdvanceStatus::PENDING)
            ->with(['user', 'shop', 'approvedBy']);

        if ($shop) {
            $query->where('shop_id', $shop->id);
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
        $query = WageAdvance::where('user_id', $user->id)
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
        return WageAdvance::where('tenant_id', $employee->tenant_id)
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
        $query = WageAdvance::where('tenant_id', $tenantId);

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
            'total_advances' => $all->count(),
            'pending_advances' => $all->where('status', WageAdvanceStatus::PENDING)->count(),
            'approved_advances' => $all->where('status', WageAdvanceStatus::APPROVED)->count(),
            'disbursed_advances' => $all->where('status', WageAdvanceStatus::DISBURSED)->count(),
            'repaying_advances' => $all->where('status', WageAdvanceStatus::REPAYING)->count(),
            'repaid_advances' => $all->where('status', WageAdvanceStatus::REPAID)->count(),
            'total_amount_requested' => $all->sum('amount_requested'),
            'total_amount_approved' => $all->whereNotNull('amount_approved')->sum('amount_approved'),
            'total_amount_disbursed' => $all->whereIn('status', [
                WageAdvanceStatus::DISBURSED,
                WageAdvanceStatus::REPAYING,
                WageAdvanceStatus::REPAID,
            ])->sum(fn ($advance) => $advance->amount_approved ?? $advance->amount_requested),
            'total_amount_outstanding' => $all->whereIn('status', [
                WageAdvanceStatus::DISBURSED,
                WageAdvanceStatus::REPAYING,
            ])->sum(fn ($advance) => $advance->getRemainingBalance()),
        ];
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
