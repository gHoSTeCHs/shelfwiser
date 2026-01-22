<?php

use App\Enums\PayrollStatus;
use App\Enums\PayRunItemStatus;
use App\Enums\PayRunStatus;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Status mapping from PayrollStatus to PayRunStatus
     */
    protected function mapStatus(PayrollStatus $status): PayRunStatus
    {
        return match ($status) {
            PayrollStatus::DRAFT => PayRunStatus::DRAFT,
            PayrollStatus::PROCESSING => PayRunStatus::CALCULATING,
            PayrollStatus::PROCESSED => PayRunStatus::PENDING_REVIEW,
            PayrollStatus::APPROVED => PayRunStatus::APPROVED,
            PayrollStatus::PAID => PayRunStatus::COMPLETED,
            PayrollStatus::CANCELLED => PayRunStatus::CANCELLED,
        };
    }

    /**
     * Run the migrations.
     * Creates PayRun records for existing PayrollPeriods that don't have one
     */
    public function up(): void
    {
        $periodsWithoutPayRuns = PayrollPeriod::query()
            ->whereDoesntHave('payRun')
            ->get();

        foreach ($periodsWithoutPayRuns as $period) {
            DB::transaction(function () use ($period) {
                $payRunStatus = $this->mapStatus($period->status);

                $payRun = PayRun::create([
                    'tenant_id' => $period->tenant_id,
                    'payroll_period_id' => $period->id,
                    'pay_calendar_id' => null,
                    'name' => "Pay Run - {$period->period_name}",
                    'reference' => 'PR-'.strtoupper(substr(md5($period->id.now()), 0, 8)),
                    'status' => $payRunStatus,
                    'notes' => 'Migrated from legacy payroll period',
                    'total_gross' => $period->total_gross_pay ?? 0,
                    'total_deductions' => $period->total_deductions ?? 0,
                    'total_net' => $period->total_net_pay ?? 0,
                    'total_employer_costs' => $period->total_gross_pay ?? 0,
                    'employee_count' => $period->employee_count ?? 0,
                    'calculated_by' => $period->processed_by_user_id,
                    'calculated_at' => $period->processed_at,
                    'approved_by' => $period->approved_by_user_id,
                    'approved_at' => $period->approved_at,
                    'completed_by' => $period->status === PayrollStatus::PAID ? $period->approved_by_user_id : null,
                    'completed_at' => $period->status === PayrollStatus::PAID ? $period->approved_at : null,
                    'created_at' => $period->created_at,
                    'updated_at' => $period->updated_at,
                ]);

                if ($period->payslips->isNotEmpty()) {
                    foreach ($period->payslips as $payslip) {
                        PayRunItem::create([
                            'pay_run_id' => $payRun->id,
                            'user_id' => $payslip->user_id,
                            'payslip_id' => $payslip->id,
                            'status' => PayRunItemStatus::CALCULATED,
                            'basic_salary' => $payslip->basic_salary ?? 0,
                            'gross_earnings' => $payslip->gross_pay ?? 0,
                            'taxable_earnings' => $payslip->gross_pay ?? 0,
                            'total_deductions' => $payslip->total_deductions ?? 0,
                            'net_pay' => $payslip->net_pay ?? 0,
                            'employer_pension' => $payslip->pension_employer ?? 0,
                            'employer_nhf' => $payslip->nhf ?? 0,
                            'total_employer_cost' => ($payslip->gross_pay ?? 0) + ($payslip->pension_employer ?? 0),
                            'earnings_breakdown' => $payslip->earnings_breakdown,
                            'deductions_breakdown' => $payslip->deductions_breakdown,
                            'tax_calculation' => $payslip->tax_breakdown ?? $payslip->tax_calculation,
                            'created_at' => $payslip->created_at,
                            'updated_at' => $payslip->updated_at,
                        ]);
                    }
                } else {
                    $employees = User::where('tenant_id', $period->tenant_id)
                        ->whereHas('employeePayrollDetail')
                        ->get();

                    foreach ($employees as $employee) {
                        PayRunItem::create([
                            'pay_run_id' => $payRun->id,
                            'user_id' => $employee->id,
                            'status' => PayRunItemStatus::PENDING,
                        ]);
                    }

                    $payRun->update(['employee_count' => $employees->count()]);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     * Removes PayRun records that were created during migration (identified by notes)
     */
    public function down(): void
    {
        PayRun::where('notes', 'Migrated from legacy payroll period')->delete();
    }
};
