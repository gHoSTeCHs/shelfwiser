<?php

namespace App\Services;

use App\DTOs\DateRange;
use App\Enums\PayRunStatus;
use App\Models\PayRun;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use Illuminate\Support\Collection;

class PayrollReportService
{
    public function getPeriods(): Collection
    {
        return PayrollPeriod::query()
            ->orderByDesc('start_date')
            ->get(['id', 'period_name', 'start_date', 'end_date']);
    }

    public function getApprovedPayRuns(): Collection
    {
        return PayRun::query()
            ->whereIn('status', [PayRunStatus::APPROVED, PayRunStatus::COMPLETED])
            ->with('payrollPeriod:id,period_name')
            ->orderByDesc('created_at')
            ->get(['id', 'reference', 'name', 'payroll_period_id', 'status', 'total_net']);
    }

    public function getPayRun(int $id): PayRun
    {
        return PayRun::query()->findOrFail($id);
    }

    public function getPayrollSummary(
        ?int $periodId = null,
        ?DateRange $dateRange = null,
        ?array $shopIds = null
    ): array {
        $query = Payslip::query()->where('status', '!=', 'cancelled');

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        $query->when($dateRange, fn ($q) => $q->whereHas('payrollPeriod',
            fn ($p) => $p->whereBetween('start_date', [$dateRange->start, $dateRange->end])
        ));

        if ($shopIds && count($shopIds) > 0) {
            $query->whereIn('shop_id', $shopIds);
        }

        $payslips = $query->with(['user:id,name,email', 'payrollPeriod:id,period_name,start_date,end_date'])->get();

        $summary = [
            'total_employees'        => $payslips->unique('user_id')->count(),
            'total_gross'            => $payslips->sum('gross_pay'),
            'total_deductions'       => $payslips->sum('total_deductions'),
            'total_net'              => $payslips->sum('net_pay'),
            'total_paye'             => $payslips->sum('income_tax'),
            'total_pension_employee' => $payslips->sum('pension_employee'),
            'total_pension_employer' => $payslips->sum('pension_employer'),
            'total_nhf'              => $payslips->sum('nhf'),
            'total_nhis'             => $payslips->sum('nhis'),
        ];

        $breakdown = $payslips->map(function ($payslip) {
            return [
                'employee_id'      => $payslip->user_id,
                'employee_name'    => $payslip->user?->name ?? 'Unknown',
                'employee_email'   => $payslip->user?->email ?? '',
                'period'           => $payslip->payrollPeriod?->period_name ?? '',
                'basic_salary'     => (float) $payslip->basic_salary,
                'gross_pay'        => (float) $payslip->gross_pay,
                'total_deductions' => (float) $payslip->total_deductions,
                'net_pay'          => (float) $payslip->net_pay,
                'paye'             => (float) $payslip->income_tax,
                'pension_employee' => (float) $payslip->pension_employee,
                'pension_employer' => (float) $payslip->pension_employer,
                'status'           => $payslip->status,
            ];
        })->values()->all();

        return [
            'summary'      => $summary,
            'breakdown'    => $breakdown,
            'period_info'  => $periodId ? PayrollPeriod::query()->find($periodId) : null,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getTaxRemittanceReport(
        ?int $periodId = null,
        ?DateRange $dateRange = null,
    ): array {
        $query = Payslip::query()
            ->where('status', '!=', 'cancelled')
            ->where('income_tax', '>', 0);

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        $query->when($dateRange, fn ($q) => $q->whereHas('payrollPeriod',
            fn ($p) => $p->whereBetween('start_date', [$dateRange->start, $dateRange->end])
        ));

        $payslips = $query->with([
            'user:id,name,email',
            'user.employeePayrollDetail:id,user_id,tax_id_number',
            'payrollPeriod:id,period_name,start_date,end_date',
        ])->get();

        $summary = [
            'total_taxable_income' => 0,
            'total_paye'           => $payslips->sum('income_tax'),
            'employee_count'       => $payslips->unique('user_id')->count(),
        ];

        $breakdown = $payslips->map(function ($payslip) {
            $taxCalc = $payslip->tax_calculation ?? [];

            return [
                'employee_id'       => $payslip->user_id,
                'employee_name'     => $payslip->user?->name ?? 'Unknown',
                'tax_id'            => $payslip->user?->employeePayrollDetail?->tax_id_number ?? 'N/A',
                'period'            => $payslip->payrollPeriod?->period_name ?? '',
                'gross_income'      => (float) $payslip->gross_pay,
                'taxable_income'    => $taxCalc['taxable_income'] ?? (float) $payslip->gross_pay,
                'tax_free_allowance' => $taxCalc['consolidated_relief'] ?? 0,
                'paye_tax'          => (float) $payslip->income_tax,
                'effective_rate'    => $payslip->gross_pay > 0
                    ? round(($payslip->income_tax / $payslip->gross_pay) * 100, 2)
                    : 0,
            ];
        })->values()->all();

        $summary['total_taxable_income'] = collect($breakdown)->sum('taxable_income');

        return [
            'summary'          => $summary,
            'breakdown'        => $breakdown,
            'remittance_info'  => [
                'due_date'   => now()->endOfMonth()->addDays(10)->format('Y-m-d'),
                'tax_office' => 'Federal Inland Revenue Service (FIRS)',
            ],
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getPensionReport(
        ?int $periodId = null,
        ?DateRange $dateRange = null,
    ): array {
        $query = Payslip::query()
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) {
                $q->where('pension_employee', '>', 0)
                    ->orWhere('pension_employer', '>', 0);
            });

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        $query->when($dateRange, fn ($q) => $q->whereHas('payrollPeriod',
            fn ($p) => $p->whereBetween('start_date', [$dateRange->start, $dateRange->end])
        ));

        $payslips = $query->with([
            'user:id,name,email',
            'user.employeePayrollDetail:id,user_id,pension_enabled',
            'payrollPeriod:id,period_name,start_date,end_date',
        ])->get();

        $summary = [
            'total_employee_contribution' => $payslips->sum('pension_employee'),
            'total_employer_contribution' => $payslips->sum('pension_employer'),
            'total_contribution'          => $payslips->sum('pension_employee') + $payslips->sum('pension_employer'),
            'employee_count'              => $payslips->unique('user_id')->count(),
        ];

        $breakdown = $payslips->map(function ($payslip) {
            return [
                'employee_id'           => $payslip->user_id,
                'employee_name'         => $payslip->user?->name ?? 'Unknown',
                'period'                => $payslip->payrollPeriod?->period_name ?? '',
                'gross_salary'          => (float) $payslip->gross_pay,
                'employee_contribution' => (float) $payslip->pension_employee,
                'employer_contribution' => (float) $payslip->pension_employer,
                'total_contribution'    => (float) $payslip->pension_employee + (float) $payslip->pension_employer,
            ];
        })->values()->all();

        return [
            'summary'         => $summary,
            'breakdown'       => $breakdown,
            'remittance_info' => [
                'due_date' => now()->endOfMonth()->addDays(7)->format('Y-m-d'),
                'pfa'      => 'Pension Fund Administrator',
            ],
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getBankSchedule(int $payRunId): array
    {
        $payRun = PayRun::query()
            ->where('id', $payRunId)
            ->with([
                'items' => function ($q) {
                    $q->where('status', 'calculated');
                },
                'items.user:id,name,email',
                'items.user.employeePayrollDetail:id,user_id,bank_name,bank_account_number',
                'payrollPeriod:id,period_name',
            ])
            ->firstOrFail();

        $schedule = $payRun->items->map(function ($item) use ($payRun) {
            $bankDetails = $item->user?->employeePayrollDetail;

            return [
                'employee_id'    => $item->user_id,
                'employee_name'  => $item->user?->name ?? 'Unknown',
                'bank_name'      => $bankDetails?->bank_name ?? 'N/A',
                'account_number' => $bankDetails?->bank_account_number ?? 'N/A',
                'net_pay'        => (float) $item->net_pay,
                'narration'      => "Salary - {$payRun->payrollPeriod?->period_name}",
            ];
        })->filter(fn ($item) => $item['net_pay'] > 0)->values()->all();

        $summary = [
            'pay_run_reference' => $payRun->reference,
            'period'            => $payRun->payrollPeriod?->period_name,
            'total_employees'   => count($schedule),
            'total_amount'      => collect($schedule)->sum('net_pay'),
        ];

        $byBank = collect($schedule)->groupBy('bank_name')->map(function ($items, $bank) {
            return [
                'bank'  => $bank,
                'count' => $items->count(),
                'total' => $items->sum('net_pay'),
            ];
        })->values()->all();

        return [
            'summary'      => $summary,
            'by_bank'      => $byBank,
            'schedule'     => $schedule,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function getPayrollJournal(
        ?int $periodId = null,
        ?DateRange $dateRange = null,
    ): array {
        $query = PayRun::query()->where('status', PayRunStatus::COMPLETED);

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        $query->when($dateRange, fn ($q) => $q->whereBetween('completed_at', [$dateRange->start, $dateRange->end]));

        $payRuns = $query
            ->with(['payrollPeriod:id,period_name,start_date,end_date'])
            ->withSum('payslips as total_paye', 'income_tax')
            ->withSum('payslips as total_pension_employee', 'pension_employee')
            ->withSum('payslips as total_pension_employer', 'pension_employer')
            ->withSum('payslips as total_nhf', 'nhf')
            ->withSum('payslips as total_nhis', 'nhis')
            ->get();

        $entries = [];

        foreach ($payRuns as $payRun) {
            $totalPension = (float) $payRun->total_pension_employee + (float) $payRun->total_pension_employer;

            $date = $payRun->completed_at?->format('Y-m-d') ?? $payRun->updated_at->format('Y-m-d');

            $entries[] = [
                'date'        => $date,
                'reference'   => $payRun->reference,
                'description' => "Salaries & Wages - {$payRun->payrollPeriod?->period_name}",
                'account'     => 'Salaries Expense',
                'debit'       => (float) $payRun->total_gross,
                'credit'      => 0,
            ];

            $entries[] = [
                'date'        => $date,
                'reference'   => $payRun->reference,
                'description' => 'Employer Pension Contribution',
                'account'     => 'Pension Expense (Employer)',
                'debit'       => (float) $payRun->total_employer_costs - (float) $payRun->total_gross,
                'credit'      => 0,
            ];

            $entries[] = [
                'date'        => $date,
                'reference'   => $payRun->reference,
                'description' => 'PAYE Tax Payable',
                'account'     => 'PAYE Tax Liability',
                'debit'       => 0,
                'credit'      => (float) $payRun->total_paye,
            ];

            $entries[] = [
                'date'        => $date,
                'reference'   => $payRun->reference,
                'description' => 'Pension Contribution Payable',
                'account'     => 'Pension Liability',
                'debit'       => 0,
                'credit'      => $totalPension,
            ];

            $entries[] = [
                'date'        => $date,
                'reference'   => $payRun->reference,
                'description' => 'Net Salaries Payable',
                'account'     => 'Salaries Payable / Bank',
                'debit'       => 0,
                'credit'      => (float) $payRun->total_net,
            ];

            if ((float) $payRun->total_nhf > 0) {
                $entries[] = [
                    'date'        => $date,
                    'reference'   => $payRun->reference,
                    'description' => 'NHF Contribution Payable',
                    'account'     => 'NHF Liability',
                    'debit'       => 0,
                    'credit'      => (float) $payRun->total_nhf,
                ];
            }

            if ((float) $payRun->total_nhis > 0) {
                $entries[] = [
                    'date'        => $date,
                    'reference'   => $payRun->reference,
                    'description' => 'NHIS Contribution Payable',
                    'account'     => 'NHIS Liability',
                    'debit'       => 0,
                    'credit'      => (float) $payRun->total_nhis,
                ];
            }
        }

        $totalDebits  = collect($entries)->sum('debit');
        $totalCredits = collect($entries)->sum('credit');

        return [
            'entries'        => $entries,
            'totals'         => [
                'debits'   => $totalDebits,
                'credits'  => $totalCredits,
                'balanced' => abs($totalDebits - $totalCredits) < 0.01,
            ],
            'pay_runs_count' => $payRuns->count(),
            'generated_at'   => now()->toIso8601String(),
        ];
    }

    public function getPayRunStatistics(?int $year = null): array
    {
        $year = $year ?? now()->year;

        $completedRuns = PayRun::query()
            ->where('status', PayRunStatus::COMPLETED)
            ->whereYear('completed_at', $year)
            ->get();

        $monthlyData = $completedRuns->groupBy(fn ($run) => $run->completed_at->format('Y-m'))
            ->map(function ($runs, $month) {
                return [
                    'month'               => $month,
                    'pay_runs'            => $runs->count(),
                    'total_gross'         => $runs->sum('total_gross'),
                    'total_net'           => $runs->sum('total_net'),
                    'total_employer_costs' => $runs->sum('total_employer_costs'),
                    'employee_count'      => $runs->sum('employee_count'),
                ];
            })->values()->all();

        return [
            'year'              => $year,
            'total_pay_runs'    => $completedRuns->count(),
            'total_gross'       => $completedRuns->sum('total_gross'),
            'total_net'         => $completedRuns->sum('total_net'),
            'total_employer_costs' => $completedRuns->sum('total_employer_costs'),
            'monthly_breakdown' => $monthlyData,
        ];
    }
}
