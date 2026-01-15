<?php

namespace App\Services;

use App\Enums\PayrollStatus;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use App\Enums\UserRole;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

/**
 * PayrollService - Legacy payroll calculation service
 *
 * @deprecated since v1.5.0, use PayRunService instead. Will be removed in v2.0.
 *
 * MIGRATION PATH:
 * - All public methods have been marked as @deprecated with trigger_error() calls
 * - Replacement methods are documented in each @deprecated annotation
 * - Last remaining usage: PayrollPeriodSeeder (migrated to PayRunService)
 *
 * WHY DEPRECATED:
 * - Uses legacy TaxService instead of modern TaxCalculationService
 * - Does not support NTA 2025 tax law (effective Jan 1, 2026)
 * - Missing YTD (Year-To-Date) calculations required for compliance
 * - Lacks modern pay run workflow (draft → calculate → review → approve → complete)
 *
 * REPLACEMENT SERVICE:
 * @see PayRunService Modern payroll service with NTA 2025 support and PayRun workflow
 * @see TaxCalculationService Date-aware tax calculations supporting multiple tax law versions
 */
readonly class PayrollService
{
    public function __construct(
        private TimesheetService $timesheetService,
        private WageAdvanceService $wageAdvanceService,
        private TaxService $taxService,
        private NotificationService $notificationService
    ) {}

    /**
     * Create a new payroll period
     *
     * @deprecated Use PayRunService::createPayrollPeriod() instead
     *
     * @throws Throwable
     */
    public function createPayrollPeriod(
        int $tenantId,
        ?int $shopId,
        Carbon $startDate,
        Carbon $endDate,
        Carbon $paymentDate,
        ?string $periodName = null
    ): PayrollPeriod {
        trigger_error('PayrollService::createPayrollPeriod() is deprecated. Use PayRunService::createPayrollPeriod() instead.', E_USER_DEPRECATED);

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

    /**
     * Process payroll for a period
     *
     * @deprecated Use PayRunService::calculatePayRun() instead. PayRunService uses date-aware
     *             TaxCalculationService for NTA 2025 compliance.
     *
     * @throws Throwable
     */
    public function processPayroll(PayrollPeriod $payrollPeriod, User $processor): PayrollPeriod
    {
        trigger_error('PayrollService::processPayroll() is deprecated. Use PayRunService::calculatePayRun() instead.', E_USER_DEPRECATED);

        if (! $payrollPeriod->status->canProcess()) {
            throw new RuntimeException('Payroll cannot be processed in current status');
        }

        return DB::transaction(function () use ($payrollPeriod, $processor) {
            $employees = $this->getEmployeesForPayroll($payrollPeriod);

            $totalGrossPay = 0;
            $totalDeductions = 0;
            $totalNetPay = 0;
            $includesGM = false;

            foreach ($employees as $employee) {
                $payslip = $this->generatePayslip($payrollPeriod, $employee);

                $totalGrossPay += (float) $payslip->gross_pay;
                $totalDeductions += (float) $payslip->total_deductions;
                $totalNetPay += (float) $payslip->net_pay;

                if ($employee->role === UserRole::GENERAL_MANAGER) {
                    $includesGM = true;
                }
            }

            $payrollPeriod->update([
                'status' => PayrollStatus::PROCESSED,
                'processed_by_user_id' => $processor->id,
                'processed_at' => now(),
                'total_gross_pay' => $totalGrossPay,
                'total_deductions' => $totalDeductions,
                'total_net_pay' => $totalNetPay,
                'employee_count' => $employees->count(),
                'includes_general_manager' => $includesGM,
                'requires_owner_approval' => $includesGM,
            ]);

            $this->clearCache($payrollPeriod->tenant_id);

            $freshPayroll = $payrollPeriod->fresh(['payslips.user', 'processedBy']);

            $this->notificationService->notifyPayrollProcessed($freshPayroll, $processor);

            return $freshPayroll;
        });
    }

    /**
     * Generate payslip for an employee
     */
    protected function generatePayslip(PayrollPeriod $payrollPeriod, User $employee): Payslip
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (! $payrollDetail) {
            throw new RuntimeException("Employee $employee->name has no payroll details configured");
        }

        $shop = $employee->shops()->first();

        if (! $shop) {
            throw new RuntimeException("Employee $employee->name is not assigned to any shop");
        }

        $earnings = $this->calculateEarnings($employee, $payrollPeriod);

        $grossPay = $earnings['gross_pay'];

        $deductions = $this->calculateDeductions($employee, $payrollPeriod, $grossPay);

        $netPay = $grossPay - $deductions['total_deductions'];

        return Payslip::query()->create([
            'payroll_period_id' => $payrollPeriod->id,
            'user_id' => $employee->id,
            'tenant_id' => $employee->tenant_id,
            'shop_id' => $shop->id,
            'basic_salary' => $earnings['basic_salary'],
            'regular_hours' => $earnings['regular_hours'],
            'regular_pay' => $earnings['regular_pay'],
            'overtime_hours' => $earnings['overtime_hours'],
            'overtime_pay' => $earnings['overtime_pay'],
            'bonus' => $earnings['bonus'],
            'commission' => $earnings['commission'],
            'gross_pay' => $grossPay,
            'income_tax' => $deductions['income_tax'],
            'pension_employee' => $deductions['pension_employee'],
            'pension_employer' => $deductions['pension_employer'],
            'nhf' => $deductions['nhf'],
            'nhis' => $deductions['nhis'],
            'wage_advance_deduction' => $deductions['wage_advance_deduction'],
            'other_deductions' => $deductions['other_deductions'],
            'total_deductions' => $deductions['total_deductions'],
            'net_pay' => $netPay,
            'earnings_breakdown' => $earnings,
            'deductions_breakdown' => $deductions,
            'tax_breakdown' => $deductions['tax_details'] ?? null,
        ]);
    }

    /**
     * Calculate earnings for an employee
     */
    protected function calculateEarnings(User $employee, PayrollPeriod $payrollPeriod): array
    {
        $payrollDetail = $employee->employeePayrollDetail;
        //        $shop = $payrollDetail->shop ?? $employee->shops()->first();

        $timesheetSummary = $this->timesheetService->getTimesheetSummary(
            $employee,
            $payrollPeriod->start_date,
            $payrollPeriod->end_date
        );

        $regularHours = $timesheetSummary['total_regular_hours'];
        $overtimeHours = $timesheetSummary['total_overtime_hours'];
        $overtimeMultiplier = $timesheetSummary['overtime_multiplier'];

        $baseSalary = 0;
        $regularPay = 0;
        $overtimePay = 0;

        switch ($payrollDetail->pay_type) {
            case PayType::SALARY:
                $baseSalary = (float) $payrollDetail->pay_amount;
                $regularPay = 0;
                $hourlyRate = $payrollDetail->calculateHourlyRate();
                $overtimePay = $overtimeHours * $hourlyRate * $overtimeMultiplier;
                break;

            case PayType::HOURLY:
                $hourlyRate = (float) $payrollDetail->pay_amount;
                $regularPay = $regularHours * $hourlyRate;
                $overtimePay = $overtimeHours * $hourlyRate * $overtimeMultiplier;
                break;

            case PayType::DAILY:
                $dailyRate = (float) $payrollDetail->pay_amount;
                $hoursPerDay = 8;
                $regularPay = ($regularHours / $hoursPerDay) * $dailyRate;
                $overtimePay = ($overtimeHours / $hoursPerDay) * $dailyRate * $overtimeMultiplier;
                break;

            case PayType::COMMISSION_BASED:
                $regularPay = 0;
                $overtimePay = 0;
                break;
        }

        $commission = $this->calculateCommission($payrollDetail, $payrollPeriod->start_date, $payrollPeriod->end_date);

        $grossPay = $baseSalary + $regularPay + $overtimePay + $commission;

        return [
            'basic_salary' => round($baseSalary, 2),
            'regular_hours' => round($regularHours, 2),
            'regular_pay' => round($regularPay, 2),
            'overtime_hours' => round($overtimeHours, 2),
            'overtime_pay' => round($overtimePay, 2),
            'bonus' => 0,
            'commission' => round($commission, 2),
            'gross_pay' => round($grossPay, 2),
        ];
    }

    /**
     * Calculate deductions for an employee
     */
    protected function calculateDeductions(User $employee, PayrollPeriod $payrollPeriod, float $grossPay): array
    {
        $payrollDetail = $employee->employeePayrollDetail;
        $shop = $employee->shops()->first();

        if (! $shop) {
            throw new RuntimeException("Employee {$employee->name} is not assigned to any shop");
        }

        $incomeTax = 0;
        $taxDetails = null;

        if ($payrollDetail->enable_tax_calculations && $payrollDetail->tax_handling === TaxHandling::SHOP_CALCULATES) {
            $annualGross = $grossPay * 12;
            $taxJurisdictionId = $shop->taxSettings?->tax_jurisdiction_id;

            if ($taxJurisdictionId) {
                $taxCalculation = $this->taxService->calculatePersonalIncomeTax(
                    $annualGross,
                    $taxJurisdictionId,
                    Carbon::now(),
                    []
                );

                $incomeTax = $taxCalculation['total_tax'] / 12;
                $taxDetails = $taxCalculation;
            }
        }

        $pensionEmployee = 0;
        $pensionEmployer = 0;

        if ($payrollDetail->pension_enabled) {
            $pensionEmployee = ($grossPay * $payrollDetail->pension_employee_rate) / 100;
            $pensionEmployer = ($grossPay * $payrollDetail->pension_employer_rate) / 100;
        }

        $nhf = 0;
        if ($payrollDetail->nhf_enabled) {
            $nhf = ($grossPay * $payrollDetail->nhf_rate) / 100;
        }

        $nhis = 0;
        if ($payrollDetail->nhis_enabled && $payrollDetail->nhis_amount) {
            $nhis = (float) $payrollDetail->nhis_amount;
        }

        $wageAdvanceDeduction = 0;
        $activeAdvances = $this->wageAdvanceService->getActiveAdvancesForPayroll(
            $employee,
            $payrollPeriod->end_date
        );

        foreach ($activeAdvances as $advance) {
            $installmentAmount = $advance->getInstallmentAmount();
            $wageAdvanceDeduction += $installmentAmount;
        }

        $otherDeductions = $this->calculateCustomDeductions($employee, $payrollPeriod, $grossPay);

        $totalDeductions = $incomeTax + $pensionEmployee + $nhf + $nhis + $wageAdvanceDeduction + $otherDeductions;

        return [
            'income_tax' => round($incomeTax, 2),
            'pension_employee' => round($pensionEmployee, 2),
            'pension_employer' => round($pensionEmployer, 2),
            'nhf' => round($nhf, 2),
            'nhis' => round($nhis, 2),
            'wage_advance_deduction' => round($wageAdvanceDeduction, 2),
            'other_deductions' => round($otherDeductions, 2),
            'total_deductions' => round($totalDeductions, 2),
            'tax_details' => $taxDetails,
        ];
    }

    /**
     * Get employees for payroll processing
     */
    protected function getEmployeesForPayroll(PayrollPeriod $payrollPeriod): Collection
    {
        $query = User::where('tenant_id', $payrollPeriod->tenant_id)
            ->where('is_active', true)
            ->whereHas('employeePayrollDetail', function ($q) use ($payrollPeriod) {
                $q->where(function ($query) use ($payrollPeriod) {
                    $query->whereNull('start_date')
                        ->orWhere('start_date', '<=', $payrollPeriod->end_date);
                })
                    ->where(function ($query) use ($payrollPeriod) {
                        $query->whereNull('end_date')
                            ->orWhere('end_date', '>=', $payrollPeriod->start_date);
                    });
            });

        if ($payrollPeriod->shop_id) {
            $query->whereHas('shops', function ($q) use ($payrollPeriod) {
                $q->where('shops.id', $payrollPeriod->shop_id);
            });
        }

        return $query->with(['employeePayrollDetail', 'shops', 'customDeductions'])->get();
    }

    /**
     * Approve payroll
     *
     * @deprecated Use PayRunService::approvePayRun() instead
     *
     * @throws Throwable
     */
    public function approvePayroll(PayrollPeriod $payrollPeriod, User $approver): PayrollPeriod
    {
        trigger_error('PayrollService::approvePayroll() is deprecated. Use PayRunService::approvePayRun() instead.', E_USER_DEPRECATED);

        if (! $payrollPeriod->status->canApprove()) {
            throw new RuntimeException('Payroll cannot be approved in current status');
        }

        return DB::transaction(function () use ($payrollPeriod, $approver) {
            $payrollPeriod->update([
                'status' => PayrollStatus::APPROVED,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
            ]);

            $this->clearCache($payrollPeriod->tenant_id);

            $freshPayroll = $payrollPeriod->fresh(['payslips', 'approvedBy']);

            $this->notificationService->notifyPayrollApproved($freshPayroll, $approver);

            return $freshPayroll;
        });
    }

    /**
     * Mark payroll as paid
     *
     * @deprecated Use PayRunService::completePayRun() instead
     *
     * @throws Throwable
     */
    public function markAsPaid(PayrollPeriod $payrollPeriod): PayrollPeriod
    {
        trigger_error('PayrollService::markAsPaid() is deprecated. Use PayRunService::completePayRun() instead.', E_USER_DEPRECATED);

        if (! $payrollPeriod->status->canPay()) {
            throw new RuntimeException('Payroll cannot be marked as paid in current status');
        }

        return DB::transaction(function () use ($payrollPeriod) {
            $payrollPeriod->update([
                'status' => PayrollStatus::PAID,
            ]);

            foreach ($payrollPeriod->payslips as $payslip) {
                $activeAdvances = $this->wageAdvanceService->getActiveAdvancesForPayroll(
                    $payslip->user,
                    $payrollPeriod->end_date
                );

                foreach ($activeAdvances as $advance) {
                    $installmentAmount = $advance->getInstallmentAmount();
                    $this->wageAdvanceService->recordRepayment($advance, $installmentAmount);
                }
            }

            $this->clearCache($payrollPeriod->tenant_id);

            $freshPayroll = $payrollPeriod->fresh(['payslips.user']);

            $this->notificationService->notifyPayrollPaid($freshPayroll);

            return $freshPayroll;
        });
    }

    /**
     * Cancel payroll - uses soft-delete for payslips to maintain audit trail
     *
     * @deprecated Use PayRunService::cancelPayRun() instead
     *
     * @throws Throwable
     */
    public function cancelPayroll(PayrollPeriod $payrollPeriod, string $reason): PayrollPeriod
    {
        trigger_error('PayrollService::cancelPayroll() is deprecated. Use PayRunService::cancelPayRun() instead.', E_USER_DEPRECATED);

        if (! $payrollPeriod->status->canCancel()) {
            throw new RuntimeException('Payroll cannot be cancelled in current status');
        }

        return DB::transaction(function () use ($payrollPeriod, $reason) {
            foreach ($payrollPeriod->payslips as $payslip) {
                $payslip->cancel($reason, auth()->id());
            }

            $payrollPeriod->update([
                'status' => PayrollStatus::CANCELLED,
                'notes' => ($payrollPeriod->notes ? $payrollPeriod->notes."\n\n" : '').
                    "Cancelled: $reason",
            ]);

            $this->clearCache($payrollPeriod->tenant_id);

            return $payrollPeriod->fresh();
        });
    }

    /**
     * Get payroll periods for tenant
     *
     * @deprecated Use PayRun queries directly or PayRunController::index() instead
     */
    public function getPayrollPeriods(
        int $tenantId,
        ?int $shopId = null,
        ?PayrollStatus $status = null
    ): Collection {
        trigger_error('PayrollService::getPayrollPeriods() is deprecated. Use PayRun queries directly instead.', E_USER_DEPRECATED);

        $query = PayrollPeriod::query()->where('tenant_id', $tenantId)
            ->with(['shop', 'processedBy', 'approvedBy']);

        if ($shopId) {
            $query->where('shop_id', $shopId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderBy('start_date', 'desc')->get();
    }

    /**
     * Get employee payslips
     *
     * @deprecated Query Payslip model directly or use PayRunController methods
     */
    public function getEmployeePayslips(User $employee): Collection
    {
        trigger_error('PayrollService::getEmployeePayslips() is deprecated. Query Payslip model directly instead.', E_USER_DEPRECATED);

        return Payslip::forUser($employee->id)
            ->with(['payrollPeriod', 'shop'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Calculate commission for an employee based on their sales
     */
    protected function calculateCommission(
        \App\Models\EmployeePayrollDetail $payrollDetail,
        Carbon $startDate,
        Carbon $endDate
    ): float {
        if ($payrollDetail->pay_type !== PayType::COMMISSION_BASED && ! $payrollDetail->commission_rate) {
            return 0;
        }

        $salesAmount = $this->getEmployeeSales($payrollDetail->user_id, $startDate, $endDate);

        return $payrollDetail->calculateCommission($salesAmount);
    }

    /**
     * Get total completed sales for an employee in a date range
     */
    protected function getEmployeeSales(int $userId, Carbon $startDate, Carbon $endDate): float
    {
        $user = User::find($userId);

        return \App\Models\Order::where('created_by', $userId)
            ->where('tenant_id', $user->tenant_id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->sum('total_amount');
    }

    /**
     * Calculate custom deductions for an employee, handling both fixed and percentage-based deductions
     */
    protected function calculateCustomDeductions(User $employee, PayrollPeriod $payrollPeriod, float $grossPay): float
    {
        $deductions = $employee->customDeductions()
            ->where('is_active', true)
            ->where('effective_from', '<=', $payrollPeriod->end_date)
            ->where(function ($q) use ($payrollPeriod) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $payrollPeriod->start_date);
            })
            ->get();

        $total = 0;

        foreach ($deductions as $deduction) {
            if ($deduction->is_percentage) {
                $amount = $grossPay * ($deduction->amount / 100);
                if ($deduction->max_amount && $amount > $deduction->max_amount) {
                    $amount = (float) $deduction->max_amount;
                }
            } else {
                $amount = (float) $deduction->amount;
            }

            $total += $amount;
        }

        return $total;
    }

    /**
     * Clear tenant cache
     */
    protected function clearCache(int $tenantId): void
    {
        Cache::tags([
            "tenant:$tenantId:payroll",
            "tenant:$tenantId:statistics",
        ])->flush();
    }
}
