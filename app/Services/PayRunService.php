<?php

namespace App\Services;

use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\PayrollPeriod;
use App\Models\User;
use App\Models\Payslip;
use App\Models\EmployeeDeduction;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PayRunService
{
    public function __construct(
        protected EarningsService $earningsService,
        protected DeductionsService $deductionsService,
        protected TaxCalculationService $taxService
    ) {}

    public function createPayRun(int $tenantId, PayrollPeriod $period, array $options = []): PayRun
    {
        return DB::transaction(function () use ($tenantId, $period, $options) {
            $payRun = PayRun::create([
                'tenant_id' => $tenantId,
                'payroll_period_id' => $period->id,
                'pay_calendar_id' => $options['pay_calendar_id'] ?? null,
                'name' => $options['name'] ?? "Pay Run - {$period->period_name}",
                'status' => PayRun::STATUS_DRAFT,
                'notes' => $options['notes'] ?? null,
            ]);

            $employees = $this->getEligibleEmployees($tenantId, $period, $options);

            foreach ($employees as $employee) {
                PayRunItem::create([
                    'pay_run_id' => $payRun->id,
                    'user_id' => $employee->id,
                    'status' => PayRunItem::STATUS_PENDING,
                ]);
            }

            $payRun->update(['employee_count' => $employees->count()]);

            return $payRun->fresh(['items']);
        });
    }

    public function calculatePayRun(PayRun $payRun): PayRun
    {
        if (!$payRun->canBeCalculated()) {
            throw new \Exception("PayRun cannot be calculated in current status: {$payRun->status}");
        }

        $payRun->update(['status' => PayRun::STATUS_CALCULATING]);

        $period = $payRun->payrollPeriod;
        $periodStart = Carbon::parse($period->start_date);
        $periodEnd = Carbon::parse($period->end_date);

        foreach ($payRun->items()->processable()->get() as $item) {
            try {
                $calculatedData = $this->calculateEmployeePay(
                    $item->user,
                    $periodStart,
                    $periodEnd
                );

                $item->markAsCalculated($calculatedData);
            } catch (\Exception $e) {
                $item->markAsError($e->getMessage());
            }
        }

        $payRun->updateTotals();
        $payRun->update([
            'status' => PayRun::STATUS_PENDING_REVIEW,
            'calculated_by' => auth()->id(),
            'calculated_at' => now(),
        ]);

        Cache::tags(["tenant:{$payRun->tenant_id}:payroll"])->flush();

        return $payRun->fresh(['items']);
    }

    public function recalculateItem(PayRunItem $item): PayRunItem
    {
        $payRun = $item->payRun;

        if (!$payRun->canBeCalculated()) {
            throw new \Exception("PayRun cannot be recalculated in current status: {$payRun->status}");
        }

        $period = $payRun->payrollPeriod;
        $periodStart = Carbon::parse($period->start_date);
        $periodEnd = Carbon::parse($period->end_date);

        try {
            $calculatedData = $this->calculateEmployeePay(
                $item->user,
                $periodStart,
                $periodEnd
            );

            $item->markAsCalculated($calculatedData);
        } catch (\Exception $e) {
            $item->markAsError($e->getMessage());
        }

        $payRun->updateTotals();

        Cache::tags(["tenant:{$payRun->tenant_id}:payroll"])->flush();

        return $item->fresh();
    }

    public function calculateEmployeePay(User $employee, Carbon $periodStart, Carbon $periodEnd): array
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (!$payrollDetail) {
            return [
                'success' => false,
                'error' => 'Employee has no payroll configuration',
                'earnings' => [],
                'deductions' => [],
            ];
        }

        try {
            $context = [
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'hours_worked' => $this->getHoursWorked($employee, $periodStart, $periodEnd),
            ];

            $earnings = $this->earningsService->calculateEmployeeEarnings(
                $employee,
                $periodStart,
                $periodEnd,
                $context
            );

            $baseSalary = collect($earnings['breakdown'])
                ->where('category', 'base')
                ->sum('amount');

            $deductions = $this->deductionsService->calculateEmployeeDeductions(
                $employee,
                $periodStart,
                $periodEnd,
                array_merge($earnings, ['basic_salary' => $baseSalary])
            );

            $taxResult = $this->taxService->calculateMonthlyPAYE(
                $employee,
                $earnings['total_taxable'],
                $deductions['total_pre_tax']
            );

            $totalDeductions = $deductions['total_deductions'] + $taxResult['tax'];
            $netPay = max(0, $earnings['total_gross'] - $totalDeductions);

            $pensionEmployerRate = $payrollDetail->pension_employer_rate ?? 10;
            $nhfRate = $payrollDetail->nhf_rate ?? 2.5;
            $employerPension = $earnings['total_pensionable'] * ($pensionEmployerRate / 100);
            $employerNhf = $baseSalary * ($nhfRate / 100);
            $totalEmployerCost = $earnings['total_gross'] + $employerPension + $employerNhf;

            return [
                'basic_salary' => $baseSalary,
                'gross_earnings' => $earnings['total_gross'],
                'taxable_earnings' => $earnings['total_taxable'],
                'total_deductions' => $totalDeductions,
                'net_pay' => $netPay,
                'employer_pension' => $employerPension,
                'employer_nhf' => $employerNhf,
                'total_employer_cost' => $totalEmployerCost,
                'earnings_breakdown' => $earnings['breakdown'],
                'deductions_breakdown' => array_merge(
                    $deductions['breakdown'],
                    [['type' => 'PAYE Tax', 'code' => 'PAYE', 'category' => 'statutory', 'amount' => $taxResult['tax']]]
                ),
                'tax_calculation' => $taxResult,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'earnings' => [],
                'deductions' => [],
            ];
        }
    }

    public function submitForApproval(PayRun $payRun): PayRun
    {
        if ($payRun->status !== PayRun::STATUS_PENDING_REVIEW) {
            throw new \Exception("PayRun must be in pending review status");
        }

        $errorCount = $payRun->items()->withErrors()->count();
        if ($errorCount > 0) {
            throw new \Exception("Cannot submit for approval: {$errorCount} items have errors");
        }

        $payRun->update(['status' => PayRun::STATUS_PENDING_APPROVAL]);

        return $payRun->fresh();
    }

    public function approvePayRun(PayRun $payRun): PayRun
    {
        if (!$payRun->canBeApproved()) {
            throw new \Exception("PayRun cannot be approved in current status: {$payRun->status}");
        }

        $payRun->update([
            'status' => PayRun::STATUS_APPROVED,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return $payRun->fresh();
    }

    public function rejectPayRun(PayRun $payRun, string $reason = null): PayRun
    {
        if ($payRun->status !== PayRun::STATUS_PENDING_APPROVAL) {
            throw new \Exception("PayRun must be pending approval to reject");
        }

        $payRun->update([
            'status' => PayRun::STATUS_PENDING_REVIEW,
            'notes' => $reason ? "Rejected: {$reason}" : $payRun->notes,
        ]);

        return $payRun->fresh();
    }

    public function completePayRun(PayRun $payRun): PayRun
    {
        if (!$payRun->canBeCompleted()) {
            throw new \Exception("PayRun cannot be completed in current status: {$payRun->status}");
        }

        return DB::transaction(function () use ($payRun) {
            $payRun->update(['status' => PayRun::STATUS_PROCESSING]);

            foreach ($payRun->items()->calculated()->get() as $item) {
                $payslip = Payslip::create([
                    'tenant_id' => $payRun->tenant_id,
                    'user_id' => $item->user_id,
                    'payroll_period_id' => $payRun->payroll_period_id,
                    'pay_run_id' => $payRun->id,
                    'basic_salary' => $item->basic_salary,
                    'gross_pay' => $item->gross_earnings,
                    'gross_earnings' => $item->gross_earnings,
                    'total_deductions' => $item->total_deductions,
                    'net_pay' => $item->net_pay,
                    'earnings_breakdown' => $item->earnings_breakdown,
                    'deductions_breakdown' => $item->deductions_breakdown,
                    'tax_calculation' => $item->tax_calculation,
                    'employer_contributions' => [
                        'pension' => $item->employer_pension,
                        'nhf' => $item->employer_nhf,
                        'total' => $item->total_employer_cost - $item->gross_earnings,
                    ],
                    'status' => 'approved',
                ]);

                $item->update(['payslip_id' => $payslip->id]);

                $this->updateDeductionRecords($item);
            }

            $payRun->update([
                'status' => PayRun::STATUS_COMPLETED,
                'completed_by' => auth()->id(),
                'completed_at' => now(),
            ]);

            Cache::tags(["tenant:{$payRun->tenant_id}:payroll"])->flush();
            Cache::tags(["tenant:{$payRun->tenant_id}:payslips"])->flush();

            return $payRun->fresh(['payslips']);
        });
    }

    public function cancelPayRun(PayRun $payRun, string $reason = null): PayRun
    {
        if (!$payRun->canBeCancelled()) {
            throw new \Exception("PayRun cannot be cancelled in current status: {$payRun->status}");
        }

        $payRun->update([
            'status' => PayRun::STATUS_CANCELLED,
            'notes' => $reason ? "Cancelled: {$reason}" : $payRun->notes,
        ]);

        return $payRun->fresh();
    }

    public function excludeEmployee(PayRun $payRun, int $userId, string $reason): PayRunItem
    {
        $item = $payRun->items()->where('user_id', $userId)->firstOrFail();
        $item->exclude($reason);

        $payRun->updateTotals();

        return $item->fresh();
    }

    public function includeEmployee(PayRun $payRun, int $userId): PayRunItem
    {
        $item = $payRun->items()->where('user_id', $userId)->firstOrFail();
        $item->reset();

        return $item->fresh();
    }

    public function addEmployee(PayRun $payRun, User $employee): PayRunItem
    {
        if ($payRun->status !== PayRun::STATUS_DRAFT) {
            throw new \Exception("Can only add employees to draft pay runs");
        }

        $existing = $payRun->items()->where('user_id', $employee->id)->first();
        if ($existing) {
            throw new \Exception("Employee already in pay run");
        }

        $item = PayRunItem::create([
            'pay_run_id' => $payRun->id,
            'user_id' => $employee->id,
            'status' => PayRunItem::STATUS_PENDING,
        ]);

        $payRun->update(['employee_count' => $payRun->items()->count()]);

        return $item;
    }

    public function removeEmployee(PayRun $payRun, int $userId): void
    {
        if ($payRun->status !== PayRun::STATUS_DRAFT) {
            throw new \Exception("Can only remove employees from draft pay runs");
        }

        $payRun->items()->where('user_id', $userId)->delete();
        $payRun->update(['employee_count' => $payRun->items()->count()]);
    }

    protected function getEligibleEmployees(int $tenantId, PayrollPeriod $period, array $options): Collection
    {
        $query = User::where('tenant_id', $tenantId)
            ->whereHas('employeePayrollDetail', function ($q) {
                $q->where('is_active', true);
            });

        if (isset($options['pay_calendar_id'])) {
            $query->whereHas('employeePayrollDetail', function ($q) use ($options) {
                $q->where('pay_calendar_id', $options['pay_calendar_id']);
            });
        }

        if (isset($options['shop_ids']) && !empty($options['shop_ids'])) {
            $query->whereHas('shops', function ($q) use ($options) {
                $q->whereIn('shops.id', $options['shop_ids']);
            });
        }

        if (isset($options['user_ids']) && !empty($options['user_ids'])) {
            $query->whereIn('id', $options['user_ids']);
        }

        return $query->get();
    }

    protected function getHoursWorked(User $employee, Carbon $start, Carbon $end): float
    {
        $timesheets = $employee->timesheets()
            ->where('tenant_id', $employee->tenant_id)
            ->whereBetween('work_date', [$start, $end])
            ->where('status', 'approved')
            ->get();

        if ($timesheets->isNotEmpty()) {
            return $timesheets->sum('total_hours');
        }

        $payrollDetail = $employee->employeePayrollDetail;
        $standardHours = $payrollDetail->standard_hours_per_week ?? 40;
        $weeksInPeriod = $start->diffInWeeks($end) ?: 1;

        return $standardHours * $weeksInPeriod;
    }

    protected function updateDeductionRecords(PayRunItem $item): void
    {
        $deductions = $item->deductions_breakdown ?? [];

        foreach ($deductions as $deduction) {
            if (isset($deduction['deduction_id']) && $deduction['amount'] > 0) {
                $employeeDeduction = EmployeeDeduction::find($deduction['deduction_id']);
                if ($employeeDeduction) {
                    $this->deductionsService->recordDeductionPayment($employeeDeduction, $deduction['amount']);
                }
            }
        }
    }

    public function getPayRunSummary(PayRun $payRun): array
    {
        $items = $payRun->items;

        return [
            'total_employees' => $items->count(),
            'calculated' => $items->where('status', PayRunItem::STATUS_CALCULATED)->count(),
            'pending' => $items->where('status', PayRunItem::STATUS_PENDING)->count(),
            'errors' => $items->where('status', PayRunItem::STATUS_ERROR)->count(),
            'excluded' => $items->where('status', PayRunItem::STATUS_EXCLUDED)->count(),
            'totals' => [
                'gross' => $payRun->total_gross,
                'deductions' => $payRun->total_deductions,
                'net' => $payRun->total_net,
                'employer_costs' => $payRun->total_employer_costs,
            ],
        ];
    }
}
