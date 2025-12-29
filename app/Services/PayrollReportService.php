<?php

namespace App\Services;

use App\Models\PayRun;
use App\Models\Payslip;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PayrollReportService
{
    public function getPayrollSummary(
        int $tenantId,
        ?int $periodId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        ?array $shopIds = null
    ): array {
        $query = Payslip::where('tenant_id', $tenantId)
            ->where('status', '!=', 'cancelled');

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        if ($startDate && $endDate) {
            $query->whereHas('payrollPeriod', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate]);
            });
        }

        if ($shopIds && count($shopIds) > 0) {
            $query->whereIn('shop_id', $shopIds);
        }

        $payslips = $query->with(['user:id,name,email', 'payrollPeriod:id,period_name,start_date,end_date'])->get();

        $summary = [
            'total_employees' => $payslips->unique('user_id')->count(),
            'total_gross' => $payslips->sum('gross_pay'),
            'total_deductions' => $payslips->sum('total_deductions'),
            'total_net' => $payslips->sum('net_pay'),
            'total_paye' => $payslips->sum('income_tax'),
            'total_pension_employee' => $payslips->sum('pension_employee'),
            'total_pension_employer' => $payslips->sum('pension_employer'),
            'total_nhf' => $payslips->sum('nhf'),
            'total_nhis' => $payslips->sum('nhis'),
        ];

        $breakdown = $payslips->map(function ($payslip) {
            return [
                'employee_id' => $payslip->user_id,
                'employee_name' => $payslip->user?->name ?? 'Unknown',
                'employee_email' => $payslip->user?->email ?? '',
                'period' => $payslip->payrollPeriod?->period_name ?? '',
                'basic_salary' => (float) $payslip->basic_salary,
                'gross_pay' => (float) $payslip->gross_pay,
                'total_deductions' => (float) $payslip->total_deductions,
                'net_pay' => (float) $payslip->net_pay,
                'paye' => (float) $payslip->income_tax,
                'pension_employee' => (float) $payslip->pension_employee,
                'pension_employer' => (float) $payslip->pension_employer,
                'status' => $payslip->status,
            ];
        })->values()->all();

        return [
            'summary' => $summary,
            'breakdown' => $breakdown,
            'period_info' => $periodId ? Payslip::find($payslips->first()?->payroll_period_id) : null,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getTaxRemittanceReport(
        int $tenantId,
        ?int $periodId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = Payslip::where('tenant_id', $tenantId)
            ->where('status', '!=', 'cancelled')
            ->where('income_tax', '>', 0);

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        if ($startDate && $endDate) {
            $query->whereHas('payrollPeriod', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate]);
            });
        }

        $payslips = $query->with([
            'user:id,name,email',
            'user.employeePayrollDetail:id,user_id,tax_id_number',
            'payrollPeriod:id,period_name,start_date,end_date'
        ])->get();

        $summary = [
            'total_taxable_income' => 0,
            'total_paye' => $payslips->sum('income_tax'),
            'employee_count' => $payslips->unique('user_id')->count(),
        ];

        $breakdown = $payslips->map(function ($payslip) {
            $taxCalc = $payslip->tax_calculation ?? [];
            return [
                'employee_id' => $payslip->user_id,
                'employee_name' => $payslip->user?->name ?? 'Unknown',
                'tax_id' => $payslip->user?->employeePayrollDetail?->tax_id_number ?? 'N/A',
                'period' => $payslip->payrollPeriod?->period_name ?? '',
                'gross_income' => (float) $payslip->gross_pay,
                'taxable_income' => $taxCalc['taxable_income'] ?? (float) $payslip->gross_pay,
                'tax_free_allowance' => $taxCalc['consolidated_relief'] ?? 0,
                'paye_tax' => (float) $payslip->income_tax,
                'effective_rate' => $payslip->gross_pay > 0
                    ? round(($payslip->income_tax / $payslip->gross_pay) * 100, 2)
                    : 0,
            ];
        })->values()->all();

        $summary['total_taxable_income'] = collect($breakdown)->sum('taxable_income');

        return [
            'summary' => $summary,
            'breakdown' => $breakdown,
            'remittance_info' => [
                'due_date' => now()->endOfMonth()->addDays(10)->format('Y-m-d'),
                'tax_office' => 'Federal Inland Revenue Service (FIRS)',
            ],
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getPensionReport(
        int $tenantId,
        ?int $periodId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = Payslip::where('tenant_id', $tenantId)
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) {
                $q->where('pension_employee', '>', 0)
                    ->orWhere('pension_employer', '>', 0);
            });

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        if ($startDate && $endDate) {
            $query->whereHas('payrollPeriod', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate]);
            });
        }

        $payslips = $query->with([
            'user:id,name,email',
            'user.employeePayrollDetail:id,user_id,pension_enabled',
            'payrollPeriod:id,period_name,start_date,end_date'
        ])->get();

        $summary = [
            'total_employee_contribution' => $payslips->sum('pension_employee'),
            'total_employer_contribution' => $payslips->sum('pension_employer'),
            'total_contribution' => $payslips->sum('pension_employee') + $payslips->sum('pension_employer'),
            'employee_count' => $payslips->unique('user_id')->count(),
        ];

        $breakdown = $payslips->map(function ($payslip) {
            return [
                'employee_id' => $payslip->user_id,
                'employee_name' => $payslip->user?->name ?? 'Unknown',
                'period' => $payslip->payrollPeriod?->period_name ?? '',
                'gross_salary' => (float) $payslip->gross_pay,
                'employee_contribution' => (float) $payslip->pension_employee,
                'employer_contribution' => (float) $payslip->pension_employer,
                'total_contribution' => (float) $payslip->pension_employee + (float) $payslip->pension_employer,
            ];
        })->values()->all();

        return [
            'summary' => $summary,
            'breakdown' => $breakdown,
            'remittance_info' => [
                'due_date' => now()->endOfMonth()->addDays(7)->format('Y-m-d'),
                'pfa' => 'Pension Fund Administrator',
            ],
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getBankSchedule(int $tenantId, int $payRunId): array
    {
        $payRun = PayRun::where('tenant_id', $tenantId)
            ->where('id', $payRunId)
            ->with([
                'items' => function ($q) {
                    $q->where('status', 'calculated');
                },
                'items.user:id,name,email',
                'items.user.employeePayrollDetail:id,user_id,bank_name,bank_account_number',
                'payrollPeriod:id,period_name'
            ])
            ->firstOrFail();

        $schedule = $payRun->items->map(function ($item) {
            $bankDetails = $item->user?->employeePayrollDetail;
            return [
                'employee_id' => $item->user_id,
                'employee_name' => $item->user?->name ?? 'Unknown',
                'bank_name' => $bankDetails?->bank_name ?? 'N/A',
                'account_number' => $bankDetails?->bank_account_number ?? 'N/A',
                'net_pay' => (float) $item->net_pay,
                'narration' => "Salary - {$payRun->payrollPeriod?->period_name}",
            ];
        })->filter(function ($item) {
            return $item['net_pay'] > 0;
        })->values()->all();

        $summary = [
            'pay_run_reference' => $payRun->reference,
            'period' => $payRun->payrollPeriod?->period_name,
            'total_employees' => count($schedule),
            'total_amount' => collect($schedule)->sum('net_pay'),
        ];

        $byBank = collect($schedule)->groupBy('bank_name')->map(function ($items, $bank) {
            return [
                'bank' => $bank,
                'count' => $items->count(),
                'total' => $items->sum('net_pay'),
            ];
        })->values()->all();

        return [
            'summary' => $summary,
            'by_bank' => $byBank,
            'schedule' => $schedule,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getPayrollJournal(
        int $tenantId,
        ?int $periodId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = PayRun::where('tenant_id', $tenantId)
            ->where('status', PayRun::STATUS_COMPLETED);

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        if ($startDate && $endDate) {
            $query->whereBetween('completed_at', [$startDate, $endDate]);
        }

        $payRuns = $query->with(['payrollPeriod:id,period_name,start_date,end_date'])->get();

        $entries = [];

        foreach ($payRuns as $payRun) {
            $entries[] = [
                'date' => $payRun->completed_at?->format('Y-m-d'),
                'reference' => $payRun->reference,
                'description' => "Salaries & Wages - {$payRun->payrollPeriod?->period_name}",
                'account' => 'Salaries Expense',
                'debit' => (float) $payRun->total_gross,
                'credit' => 0,
            ];

            $entries[] = [
                'date' => $payRun->completed_at?->format('Y-m-d'),
                'reference' => $payRun->reference,
                'description' => "Employer Pension Contribution",
                'account' => 'Pension Expense (Employer)',
                'debit' => (float) $payRun->total_employer_costs - (float) $payRun->total_gross,
                'credit' => 0,
            ];

            $entries[] = [
                'date' => $payRun->completed_at?->format('Y-m-d'),
                'reference' => $payRun->reference,
                'description' => "PAYE Tax Payable",
                'account' => 'PAYE Tax Liability',
                'debit' => 0,
                'credit' => $this->getTotalPAYE($payRun),
            ];

            $entries[] = [
                'date' => $payRun->completed_at?->format('Y-m-d'),
                'reference' => $payRun->reference,
                'description' => "Pension Contribution Payable",
                'account' => 'Pension Liability',
                'debit' => 0,
                'credit' => $this->getTotalPension($payRun),
            ];

            $entries[] = [
                'date' => $payRun->completed_at?->format('Y-m-d'),
                'reference' => $payRun->reference,
                'description' => "Net Salaries Payable",
                'account' => 'Salaries Payable / Bank',
                'debit' => 0,
                'credit' => (float) $payRun->total_net,
            ];
        }

        $totalDebits = collect($entries)->sum('debit');
        $totalCredits = collect($entries)->sum('credit');

        return [
            'entries' => $entries,
            'totals' => [
                'debits' => $totalDebits,
                'credits' => $totalCredits,
                'balanced' => abs($totalDebits - $totalCredits) < 0.01,
            ],
            'pay_runs_count' => $payRuns->count(),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    protected function getTotalPAYE(PayRun $payRun): float
    {
        return $payRun->payslips()->sum('income_tax');
    }

    protected function getTotalPension(PayRun $payRun): float
    {
        $employee = $payRun->payslips()->sum('pension_employee');
        $employer = $payRun->payslips()->sum('pension_employer');
        return $employee + $employer;
    }

    public function getPayRunStatistics(int $tenantId, ?int $year = null): array
    {
        $year = $year ?? now()->year;

        $completedRuns = PayRun::where('tenant_id', $tenantId)
            ->where('status', PayRun::STATUS_COMPLETED)
            ->whereYear('completed_at', $year)
            ->get();

        $monthlyData = $completedRuns->groupBy(function ($run) {
            return $run->completed_at->format('Y-m');
        })->map(function ($runs, $month) {
            return [
                'month' => $month,
                'pay_runs' => $runs->count(),
                'total_gross' => $runs->sum('total_gross'),
                'total_net' => $runs->sum('total_net'),
                'total_employer_costs' => $runs->sum('total_employer_costs'),
                'employee_count' => $runs->sum('employee_count'),
            ];
        })->values()->all();

        return [
            'year' => $year,
            'total_pay_runs' => $completedRuns->count(),
            'total_gross' => $completedRuns->sum('total_gross'),
            'total_net' => $completedRuns->sum('total_net'),
            'total_employer_costs' => $completedRuns->sum('total_employer_costs'),
            'monthly_breakdown' => $monthlyData,
        ];
    }
}
