<?php

namespace App\Services;

use App\Enums\EarningCategory;
use App\Enums\PayType;
use App\Models\EarningType;
use App\Models\EmployeeEarning;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EarningsService
{
    /**
     * Get active earnings for an employee as of a specific date
     */
    public function getActiveEarnings(User $employee, ?Carbon $asOfDate = null): Collection
    {
        $date = $asOfDate ?? now();

        return $employee->employeeEarnings()
            ->with('earningType')
            ->activeOn($date)
            ->get();
    }

    /**
     * Calculate all earnings for an employee for a pay period
     */
    public function calculateEmployeeEarnings(
        User $employee,
        Carbon $periodStart,
        Carbon $periodEnd,
        array $context = []
    ): array {
        $earnings = $this->getActiveEarnings($employee, $periodEnd);
        $payrollDetail = $employee->employeePayrollDetail;
        $baseSalary = (float) ($payrollDetail->pay_amount ?? 0);

        $breakdown = [];
        $totalGross = 0;
        $totalTaxable = 0;
        $totalPensionable = 0;

        $hasBaseEarning = $earnings->contains(fn ($e) => $e->earningType->category === 'base');
        if (! $hasBaseEarning) {
            $breakdown[] = [
                'type' => 'Basic Salary',
                'category' => 'base',
                'amount' => $baseSalary,
                'is_taxable' => true,
                'is_pensionable' => true,
            ];
            $totalGross += $baseSalary;
            $totalTaxable += $baseSalary;
            $totalPensionable += $baseSalary;
        }

        $hasCommissionEarning = $earnings->contains(fn ($e) => $e->earningType->category === EarningCategory::COMMISSION);
        if (! $hasCommissionEarning && $payrollDetail && ($payrollDetail->pay_type === PayType::COMMISSION_BASED || $payrollDetail->commission_rate > 0)) {
            $commissionAmount = $this->calculateCommissionEarning($employee, $periodStart, $periodEnd);
            if ($commissionAmount > 0) {
                $breakdown[] = [
                    'type' => 'Sales Commission',
                    'category' => 'commission',
                    'amount' => $commissionAmount,
                    'is_taxable' => true,
                    'is_pensionable' => true,
                ];
                $totalGross += $commissionAmount;
                $totalTaxable += $commissionAmount;
                $totalPensionable += $commissionAmount;
            }
        }

        foreach ($earnings as $earning) {
            $type = $earning->earningType;

            if ($type->category === EarningCategory::COMMISSION) {
                $amount = $this->calculateCommissionEarning($employee, $periodStart, $periodEnd);
            } else {
                $amount = $earning->calculateAmount($baseSalary, $context);
            }

            $breakdown[] = [
                'type' => $type->name,
                'category' => $type->category,
                'amount' => $amount,
                'is_taxable' => $type->is_taxable,
                'is_pensionable' => $type->is_pensionable,
            ];

            $totalGross += $amount;
            if ($type->is_taxable) {
                $totalTaxable += $amount;
            }
            if ($type->is_pensionable) {
                $totalPensionable += $amount;
            }
        }

        return [
            'breakdown' => $breakdown,
            'total_gross' => $totalGross,
            'total_taxable' => $totalTaxable,
            'total_pensionable' => $totalPensionable,
        ];
    }

    /**
     * Assign an earning to an employee
     */
    public function assignEarning(
        User $employee,
        EarningType $earningType,
        array $data
    ): EmployeeEarning {
        if (isset($data['amount']) && $data['amount'] < 0) {
            throw new \InvalidArgumentException('Earning amount cannot be negative');
        }

        if (isset($data['rate']) && $data['rate'] < 0) {
            throw new \InvalidArgumentException('Earning rate cannot be negative');
        }

        if (isset($data['effective_from'], $data['effective_to'])) {
            $effectiveFrom = Carbon::parse($data['effective_from']);
            $effectiveTo = Carbon::parse($data['effective_to']);
            if ($effectiveTo->lt($effectiveFrom)) {
                throw new \InvalidArgumentException('Effective end date must be after start date');
            }
        }

        return DB::transaction(function () use ($employee, $earningType, $data) {
            return EmployeeEarning::create([
                'tenant_id' => $employee->tenant_id,
                'user_id' => $employee->id,
                'earning_type_id' => $earningType->id,
                'amount' => $data['amount'] ?? null,
                'rate' => $data['rate'] ?? null,
                'effective_from' => $data['effective_from'] ?? now(),
                'effective_to' => $data['effective_to'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'custom_rules' => $data['custom_rules'] ?? null,
            ]);
        });
    }

    /**
     * Update an employee earning
     */
    public function updateEarning(EmployeeEarning $earning, array $data): EmployeeEarning
    {
        return DB::transaction(function () use ($earning, $data) {
            $earning->update($data);

            return $earning->fresh();
        });
    }

    /**
     * End an employee earning (set effective_to date)
     */
    public function endEarning(EmployeeEarning $earning, ?Carbon $effectiveTo = null): EmployeeEarning
    {
        return DB::transaction(function () use ($earning, $effectiveTo) {
            $earning->update([
                'effective_to' => $effectiveTo ?? now(),
                'is_active' => false,
            ]);

            return $earning->fresh();
        });
    }

    /**
     * Create a new earning type for a tenant
     */
    public function createEarningType(int $tenantId, array $data): EarningType
    {
        return EarningType::create([
            'tenant_id' => $tenantId,
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'],
            'calculation_type' => $data['calculation_type'],
            'default_amount' => $data['default_amount'] ?? null,
            'default_rate' => $data['default_rate'] ?? null,
            'is_taxable' => $data['is_taxable'] ?? true,
            'is_pensionable' => $data['is_pensionable'] ?? true,
            'is_recurring' => $data['is_recurring'] ?? true,
            'is_system' => false,
            'is_active' => true,
            'display_order' => $data['display_order'] ?? 0,
        ]);
    }

    /**
     * Get all earning types for a tenant
     */
    public function getEarningTypes(int $tenantId, bool $activeOnly = true): Collection
    {
        $query = EarningType::forTenant($tenantId);

        if ($activeOnly) {
            $query->active();
        }

        return $query->orderBy('display_order')->get();
    }

    /**
     * Get earning types by category for a tenant
     */
    public function getEarningTypesByCategory(int $tenantId, string $category): Collection
    {
        return EarningType::forTenant($tenantId)
            ->active()
            ->byCategory($category)
            ->orderBy('display_order')
            ->get();
    }

    /**
     * Calculate commission earnings for an employee based on their sales in the period.
     * Uses date filtering to only count sales within the specified period.
     *
     * @param  User  $employee  The employee to calculate commission for
     * @param  Carbon  $periodStart  Start date of the pay period
     * @param  Carbon  $periodEnd  End date of the pay period
     * @return float Commission amount
     */
    protected function calculateCommissionEarning(User $employee, Carbon $periodStart, Carbon $periodEnd): float
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (! $payrollDetail || (! $payrollDetail->commission_rate || $payrollDetail->commission_rate <= 0)) {
            return 0;
        }

        $salesAmount = Order::where('created_by', $employee->id)
            ->where('tenant_id', $employee->tenant_id)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->where('status', 'completed')
            ->sum('total_amount');

        return $payrollDetail->calculateCommission($salesAmount);
    }
}
