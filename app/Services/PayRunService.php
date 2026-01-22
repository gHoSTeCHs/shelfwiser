<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Enums\PayrollStatus;
use App\Enums\PayRunItemStatus;
use App\Enums\PayRunStatus;
use App\Models\EmployeeDeduction;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\Payslip;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PayRunService
{
    public function __construct(
        protected EarningsService $earningsService,
        protected DeductionsService $deductionsService,
        protected TaxCalculationService $taxService,
        protected NotificationService $notificationService,
        protected WageAdvanceService $wageAdvanceService
    ) {}

    /**
     * Create a new payroll period with overlap validation
     *
     * @throws RuntimeException if overlapping period exists
     */
    public function createPayrollPeriod(
        int $tenantId,
        ?int $shopId,
        Carbon $startDate,
        Carbon $endDate,
        Carbon $paymentDate,
        ?string $periodName = null
    ): PayrollPeriod {
        return DB::transaction(function () use ($tenantId, $shopId, $startDate, $endDate, $paymentDate, $periodName) {
            $overlapping = PayrollPeriod::query()
                ->where('tenant_id', $tenantId)
                ->where('shop_id', $shopId)
                ->where(function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function ($q) use ($startDate, $endDate) {
                            $q->where('start_date', '<=', $startDate)
                                ->where('end_date', '>=', $endDate);
                        });
                })
                ->exists();

            if ($overlapping) {
                throw new RuntimeException('A payroll period with overlapping dates already exists for this shop');
            }

            $name = $periodName ?? $startDate->format('F Y');

            $payrollPeriod = PayrollPeriod::query()->create([
                'tenant_id' => $tenantId,
                'shop_id' => $shopId,
                'period_name' => $name,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'payment_date' => $paymentDate,
                'status' => PayrollStatus::DRAFT,
            ]);

            $this->clearCache($tenantId);

            return $payrollPeriod->fresh();
        });
    }

    public function createPayRun(int $tenantId, PayrollPeriod $period, array $options = []): PayRun
    {
        return DB::transaction(function () use ($tenantId, $period, $options) {
            $payRun = PayRun::create([
                'tenant_id' => $tenantId,
                'payroll_period_id' => $period->id,
                'pay_calendar_id' => $options['pay_calendar_id'] ?? null,
                'name' => $options['name'] ?? "Pay Run - {$period->period_name}",
                'status' => PayRunStatus::DRAFT,
                'notes' => $options['notes'] ?? null,
            ]);

            $employees = $this->getEligibleEmployees($tenantId, $period, $options);

            foreach ($employees as $employee) {
                PayRunItem::create([
                    'pay_run_id' => $payRun->id,
                    'user_id' => $employee->id,
                    'status' => PayRunItemStatus::PENDING,
                ]);
            }

            $payRun->update(['employee_count' => $employees->count()]);

            return $payRun->fresh(['items']);
        });
    }

    public function calculatePayRun(PayRun $payRun): PayRun
    {
        if (! $payRun->canBeCalculated()) {
            throw new \Exception("PayRun cannot be calculated in current status: {$payRun->status}");
        }

        $payRun->update(['status' => PayRunStatus::CALCULATING]);

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
            'status' => PayRunStatus::PENDING_REVIEW,
            'calculated_by' => auth()->id(),
            'calculated_at' => now(),
        ]);

        Cache::tags(["tenant:{$payRun->tenant_id}:payroll"])->flush();

        return $payRun->fresh(['items']);
    }

    public function recalculateItem(PayRunItem $item): PayRunItem
    {
        $payRun = $item->payRun;

        if (! $payRun->canBeCalculated()) {
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

        if (! $payrollDetail) {
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
                $deductions['total_pre_tax'],
                [],
                $periodEnd
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
        if ($payRun->status !== PayRunStatus::PENDING_REVIEW) {
            throw new \Exception('PayRun must be in pending review status');
        }

        $errorCount = $payRun->items()->withErrors()->count();
        if ($errorCount > 0) {
            throw new \Exception("Cannot submit for approval: {$errorCount} items have errors");
        }

        $payRun->update(['status' => PayRunStatus::PENDING_APPROVAL]);

        return $payRun->fresh();
    }

    public function approvePayRun(PayRun $payRun): PayRun
    {
        if (! $payRun->canBeApproved()) {
            throw new \Exception("PayRun cannot be approved in current status: {$payRun->status}");
        }

        $payRun->update([
            'status' => PayRunStatus::APPROVED,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        $freshPayRun = $payRun->fresh(['payrollPeriod']);

        $this->notifyPayRunApproved($freshPayRun, auth()->user());

        return $freshPayRun;
    }

    public function rejectPayRun(PayRun $payRun, ?string $reason = null): PayRun
    {
        if ($payRun->status !== PayRunStatus::PENDING_APPROVAL) {
            throw new \Exception('PayRun must be pending approval to reject');
        }

        $payRun->update([
            'status' => PayRunStatus::PENDING_REVIEW,
            'notes' => $reason ? "Rejected: {$reason}" : $payRun->notes,
        ]);

        return $payRun->fresh();
    }

    public function completePayRun(PayRun $payRun): PayRun
    {
        if (! $payRun->canBeCompleted()) {
            throw new \Exception("PayRun cannot be completed in current status: {$payRun->status}");
        }

        return DB::transaction(function () use ($payRun) {
            $payRun->update(['status' => PayRunStatus::PROCESSING]);

            $period = $payRun->payrollPeriod;
            $periodEnd = Carbon::parse($period->end_date);

            foreach ($payRun->items()->calculated()->get() as $item) {
                $ytdData = $this->calculateYTDValues($item->user_id, $periodEnd);

                $taxCalc = $item->tax_calculation ?? [];
                $pensionEmployee = collect($item->deductions_breakdown ?? [])
                    ->where('code', 'PENSION')
                    ->sum('amount');

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
                    'ytd_gross' => $ytdData['ytd_gross'] + $item->gross_earnings,
                    'ytd_tax' => $ytdData['ytd_tax'] + ($taxCalc['tax'] ?? 0),
                    'ytd_pension' => $ytdData['ytd_pension'] + $pensionEmployee,
                    'ytd_net' => $ytdData['ytd_net'] + $item->net_pay,
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

                $this->recordWageAdvanceRepayments($item, $periodEnd);
            }

            $payRun->update([
                'status' => PayRunStatus::COMPLETED,
                'completed_by' => auth()->id(),
                'completed_at' => now(),
            ]);

            Cache::tags(["tenant:{$payRun->tenant_id}:payroll"])->flush();
            Cache::tags(["tenant:{$payRun->tenant_id}:payslips"])->flush();

            $freshPayRun = $payRun->fresh(['payslips', 'payrollPeriod']);

            $this->notifyPayRunCompleted($freshPayRun);

            return $freshPayRun;
        });
    }

    public function cancelPayRun(PayRun $payRun, ?string $reason = null): PayRun
    {
        if (! $payRun->canBeCancelled()) {
            throw new \Exception("PayRun cannot be cancelled in current status: {$payRun->status}");
        }

        $payRun->update([
            'status' => PayRunStatus::CANCELLED,
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
        if ($payRun->status !== PayRunStatus::DRAFT) {
            throw new \Exception('Can only add employees to draft pay runs');
        }

        $existing = $payRun->items()->where('user_id', $employee->id)->first();
        if ($existing) {
            throw new \Exception('Employee already in pay run');
        }

        $item = PayRunItem::create([
            'pay_run_id' => $payRun->id,
            'user_id' => $employee->id,
            'status' => PayRunItemStatus::PENDING,
        ]);

        $payRun->update(['employee_count' => $payRun->items()->count()]);

        return $item;
    }

    public function removeEmployee(PayRun $payRun, int $userId): void
    {
        if ($payRun->status !== PayRunStatus::DRAFT) {
            throw new \Exception('Can only remove employees from draft pay runs');
        }

        $payRun->items()->where('user_id', $userId)->delete();
        $payRun->update(['employee_count' => $payRun->items()->count()]);
    }

    protected function getEligibleEmployees(int $tenantId, PayrollPeriod $period, array $options): Collection
    {
        $periodStart = Carbon::parse($period->start_date);
        $periodEnd = Carbon::parse($period->end_date);

        $query = User::where('tenant_id', $tenantId)
            ->whereHas('employeePayrollDetail', function ($q) use ($periodStart, $periodEnd) {
                $q->where(function ($inner) use ($periodEnd) {
                    $inner->whereNull('start_date')
                        ->orWhere('start_date', '<=', $periodEnd);
                })->where(function ($inner) use ($periodStart) {
                    $inner->whereNull('end_date')
                        ->orWhere('end_date', '>=', $periodStart);
                });
            });

        if (isset($options['pay_calendar_id'])) {
            $query->whereHas('employeePayrollDetail', function ($q) use ($options) {
                $q->where('pay_calendar_id', $options['pay_calendar_id']);
            });
        }

        if (isset($options['shop_ids']) && ! empty($options['shop_ids'])) {
            $query->whereHas('shops', function ($q) use ($options) {
                $q->whereIn('shops.id', $options['shop_ids']);
            });
        }

        if (isset($options['user_ids']) && ! empty($options['user_ids'])) {
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
            'calculated' => $items->where('status', PayRunItemStatus::CALCULATED)->count(),
            'pending' => $items->where('status', PayRunItemStatus::PENDING)->count(),
            'errors' => $items->where('status', PayRunItemStatus::ERROR)->count(),
            'excluded' => $items->where('status', PayRunItemStatus::EXCLUDED)->count(),
            'totals' => [
                'gross' => $payRun->total_gross,
                'deductions' => $payRun->total_deductions,
                'net' => $payRun->total_net,
                'employer_costs' => $payRun->total_employer_costs,
            ],
        ];
    }

    /**
     * Record wage advance repayments for an employee during payroll completion
     */
    protected function recordWageAdvanceRepayments(PayRunItem $item, Carbon $payrollDate): void
    {
        $employee = $item->user;
        $activeAdvances = $this->wageAdvanceService->getActiveAdvancesForPayroll($employee, $payrollDate);

        foreach ($activeAdvances as $advance) {
            $installmentAmount = $advance->getInstallmentAmount();
            if ($installmentAmount > 0) {
                $this->wageAdvanceService->recordRepayment($advance, $installmentAmount);
            }
        }
    }

    /**
     * Send notifications when a pay run is approved
     */
    protected function notifyPayRunApproved(PayRun $payRun, User $approver): void
    {
        $minimumLevel = NotificationType::PAYROLL_APPROVED->minimumRoleLevel();

        if ($minimumLevel) {
            $period = $payRun->payrollPeriod;
            $this->notificationService->createForRole(
                tenantId: $payRun->tenant_id,
                type: NotificationType::PAYROLL_APPROVED,
                title: 'Pay Run Approved',
                message: "Pay run '{$payRun->name}' for period '{$period->period_name}' has been approved by {$approver->name}.",
                minimumRoleLevel: $minimumLevel,
                actionUrl: route('pay-runs.show', $payRun),
                notifiable: $payRun
            );
        }
    }

    /**
     * Send notifications when a pay run is completed (payslips generated)
     */
    protected function notifyPayRunCompleted(PayRun $payRun): void
    {
        $period = $payRun->payrollPeriod;

        foreach ($payRun->payslips as $payslip) {
            $this->notificationService->createForUser(
                user: $payslip->user,
                type: NotificationType::PAYROLL_PAID,
                title: 'Payment Processed',
                message: "Your payment for '{$period->period_name}' has been processed. Net pay: ₦".number_format($payslip->net_pay, 2),
                actionUrl: route('payroll.show-payslip', $payslip),
                notifiable: $payslip,
                data: [
                    'net_pay' => $payslip->net_pay,
                    'payment_date' => $period->payment_date,
                ]
            );
        }
    }

    /**
     * Get the start date of the tax year for a given date
     */
    protected function getTaxYearStart(Carbon $date): Carbon
    {
        return Carbon::create($date->year, 1, 1)->startOfDay();
    }

    /**
     * Calculate Year-To-Date values for an employee
     */
    protected function calculateYTDValues(int $userId, Carbon $periodEnd): array
    {
        $taxYearStart = $this->getTaxYearStart($periodEnd);
        $tenantId = auth()->user()->tenant_id;

        $ytdData = Payslip::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->whereHas('payrollPeriod', function ($query) use ($taxYearStart, $periodEnd) {
                $query->where('payment_date', '>=', $taxYearStart)
                    ->where('payment_date', '<', $periodEnd);
            })
            ->where('status', '!=', 'cancelled')
            ->selectRaw('
                COALESCE(SUM(gross_pay), 0) as ytd_gross,
                COALESCE(SUM(income_tax), 0) as ytd_tax,
                COALESCE(SUM(pension_employee), 0) as ytd_pension,
                COALESCE(SUM(net_pay), 0) as ytd_net
            ')
            ->first();

        return [
            'ytd_gross' => (float) ($ytdData->ytd_gross ?? 0),
            'ytd_tax' => (float) ($ytdData->ytd_tax ?? 0),
            'ytd_pension' => (float) ($ytdData->ytd_pension ?? 0),
            'ytd_net' => (float) ($ytdData->ytd_net ?? 0),
        ];
    }

    /**
     * Clear tenant-related caches
     */
    protected function clearCache(int $tenantId): void
    {
        Cache::tags([
            "tenant:{$tenantId}:payroll",
            "tenant:{$tenantId}:statistics",
        ])->flush();
    }
}
