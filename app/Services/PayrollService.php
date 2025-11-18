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
        return DB::transaction(function () use ($tenantId, $shopId, $startDate, $endDate, $paymentDate, $periodName) {
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
     * @throws Throwable
     */
    public function processPayroll(PayrollPeriod $payrollPeriod, User $processor): PayrollPeriod
    {
        if (! $payrollPeriod->status->canProcess()) {
            throw new RuntimeException('Payroll cannot be processed in current status');
        }

        return DB::transaction(function () use ($payrollPeriod, $processor) {
            $payrollPeriod->update([
                'status' => PayrollStatus::PROCESSING,
            ]);

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
        $payrollDetail = $employee->payrollDetail;

        if (! $payrollDetail) {
            throw new RuntimeException("Employee $employee->name has no payroll details configured");
        }

        $shop = $payrollDetail->shop ?? $employee->shops()->first();

        $earnings = $this->calculateEarnings($employee, $payrollPeriod);

        $grossPay = $earnings['gross_pay'];

        $deductions = $this->calculateDeductions($employee, $payrollPeriod, $grossPay);

        $netPay = $grossPay - $deductions['total_deductions'];

        return Payslip::query()->create([
            'payroll_period_id' => $payrollPeriod->id,
            'user_id' => $employee->id,
            'tenant_id' => $employee->tenant_id,
            'shop_id' => $shop->id,
            'base_salary' => $earnings['base_salary'],
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
        $payrollDetail = $employee->payrollDetail;
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
                $regularPay = $baseSalary;
                $hourlyRate = $baseSalary / 160;
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
        }

        $grossPay = $baseSalary + $regularPay + $overtimePay;

        return [
            'base_salary' => round($baseSalary, 2),
            'regular_hours' => round($regularHours, 2),
            'regular_pay' => round($regularPay, 2),
            'overtime_hours' => round($overtimeHours, 2),
            'overtime_pay' => round($overtimePay, 2),
            'bonus' => 0,
            'commission' => 0,
            'gross_pay' => round($grossPay, 2),
        ];
    }

    /**
     * Calculate deductions for an employee
     */
    protected function calculateDeductions(User $employee, PayrollPeriod $payrollPeriod, float $grossPay): array
    {
        $payrollDetail = $employee->payrollDetail;
        $shop = $payrollDetail->shop ?? $employee->shops()->first();

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

        $otherDeductions = $employee->customDeductions()
            ->where('is_active', true)
            ->sum('amount');

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
            ->whereHas('payrollDetail');

        if ($payrollPeriod->shop_id) {
            $query->whereHas('shops', function ($q) use ($payrollPeriod) {
                $q->where('shops.id', $payrollPeriod->shop_id);
            });
        }

        return $query->with(['payrollDetail', 'shops', 'customDeductions'])->get();
    }

    /**
     * Approve payroll
     *
     * @throws Throwable
     */
    public function approvePayroll(PayrollPeriod $payrollPeriod, User $approver): PayrollPeriod
    {
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
     * @throws Throwable
     */
    public function markAsPaid(PayrollPeriod $payrollPeriod): PayrollPeriod
    {
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
     * Cancel payroll
     *
     * @throws Throwable
     */
    public function cancelPayroll(PayrollPeriod $payrollPeriod, string $reason): PayrollPeriod
    {
        if (! $payrollPeriod->status->canCancel()) {
            throw new RuntimeException('Payroll cannot be cancelled in current status');
        }

        return DB::transaction(function () use ($payrollPeriod, $reason) {
            $payrollPeriod->payslips()->delete();

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
     */
    public function getPayrollPeriods(
        int $tenantId,
        ?int $shopId = null,
        ?PayrollStatus $status = null
    ): Collection {
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
     */
    public function getEmployeePayslips(User $employee): Collection
    {
        return Payslip::forUser($employee->id)
            ->with(['payrollPeriod', 'shop'])
            ->orderBy('created_at', 'desc')
            ->get();
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
