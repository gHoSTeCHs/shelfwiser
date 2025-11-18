<?php

namespace App\Services;

use App\Models\EmployeePayrollDetail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class EmployeePayrollService
{
    /**
     * Create payroll details for an employee
     */
    public function createEmployeePayroll(User $employee, array $data): EmployeePayrollDetail
    {
        return DB::transaction(function () use ($employee, $data) {
            $payrollDetail = EmployeePayrollDetail::create([
                'user_id' => $employee->id,
                'tenant_id' => $employee->tenant_id,
                'employment_type' => $data['employment_type'],
                'pay_type' => $data['pay_type'],
                'pay_amount' => $data['pay_amount'],
                'pay_frequency' => $data['pay_frequency'] ?? 'monthly',
                'tax_handling' => $data['tax_handling'] ?? 'employee_calculates',
                'enable_tax_calculations' => $data['enable_tax_calculations'] ?? false,
                'tax_id_number' => $data['tax_id_number'] ?? null,
                'pension_enabled' => $data['pension_enabled'] ?? false,
                'pension_employee_rate' => $data['pension_employee_rate'] ?? 8.00,
                'pension_employer_rate' => $data['pension_employer_rate'] ?? 10.00,
                'nhf_enabled' => $data['nhf_enabled'] ?? false,
                'nhf_rate' => $data['nhf_rate'] ?? 2.50,
                'nhis_enabled' => $data['nhis_enabled'] ?? false,
                'nhis_amount' => $data['nhis_amount'] ?? null,
                'other_deductions_enabled' => $data['other_deductions_enabled'] ?? false,
                'bank_account_number' => $data['bank_account_number'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'routing_number' => $data['routing_number'] ?? null,
                'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
                'position_title' => $data['position_title'] ?? null,
                'department' => $data['department'] ?? null,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
            ]);

            Cache::tags(["tenant:{$employee->tenant_id}:payroll"])->flush();

            return $payrollDetail->fresh();
        });
    }

    /**
     * Update payroll details for an employee
     */
    public function updatePayrollDetails(User $employee, array $data): EmployeePayrollDetail
    {
        return DB::transaction(function () use ($employee, $data) {
            $payrollDetail = $employee->employeePayrollDetail;

            if (! $payrollDetail) {
                return $this->createEmployeePayroll($employee, $data);
            }

            $payrollDetail->update($data);

            Cache::tags(["tenant:{$employee->tenant_id}:payroll"])->flush();

            return $payrollDetail->fresh();
        });
    }

    /**
     * Get comprehensive payroll summary for an employee
     */
    public function getPayrollSummary(User $employee): array
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (! $payrollDetail) {
            return ['has_payroll' => false];
        }

        $customDeductions = $employee->customDeductions()
            ->where('is_active', true)
            ->get();

        return [
            'has_payroll' => true,
            'employment_type' => $payrollDetail->employment_type->value,
            'employment_type_label' => $payrollDetail->employment_type->label(),
            'pay_type' => $payrollDetail->pay_type->value,
            'pay_type_label' => $payrollDetail->pay_type->label(),
            'pay_amount' => $payrollDetail->pay_amount,
            'pay_frequency' => $payrollDetail->pay_frequency->value,
            'pay_frequency_label' => $payrollDetail->pay_frequency->label(),
            'tax_handling' => $payrollDetail->tax_handling->value,
            'enable_tax_calculations' => $payrollDetail->enable_tax_calculations,
            'pension_enabled' => $payrollDetail->pension_enabled,
            'nhf_enabled' => $payrollDetail->nhf_enabled,
            'nhis_enabled' => $payrollDetail->nhis_enabled,
            'has_bank_account' => ! empty($payrollDetail->bank_account_number),
            'bank_name' => $payrollDetail->bank_name,
            'position_title' => $payrollDetail->position_title,
            'department' => $payrollDetail->department,
            'start_date' => $payrollDetail->start_date?->format('Y-m-d'),
            'custom_deductions_count' => $customDeductions->count(),
            'custom_deductions' => $customDeductions->toArray(),
        ];
    }

    /**
     * Check if a manager can manage an employee's payroll
     */
    public function canManageEmployee(User $manager, User $employee): bool
    {
        if ($manager->is_tenant_owner || $manager->tenant_id !== $employee->tenant_id) {
            return $manager->tenant_id === $employee->tenant_id;
        }

        return $manager->role->level() > $employee->role->level();
    }

    /**
     * Get wage advance eligibility for an employee
     */
    public function getWageAdvanceEligibility(User $employee): array
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (! $payrollDetail) {
            return [
                'eligible' => false,
                'reason' => 'No payroll details configured',
            ];
        }

        $shop = $employee->shops()->first();

        if (! $shop || ! $shop->taxSettings) {
            return [
                'eligible' => false,
                'reason' => 'No shop tax settings configured',
            ];
        }

        $maxPercentage = $shop->taxSettings->wage_advance_max_percentage;

        $maxAmount = match ($payrollDetail->pay_type->value) {
            'salary' => ($payrollDetail->pay_amount / 12) * ($maxPercentage / 100),
            'hourly', 'daily' => $payrollDetail->pay_amount * 160 * ($maxPercentage / 100),
            default => 0,
        };

        return [
            'eligible' => true,
            'max_percentage' => $maxPercentage,
            'max_amount' => round($maxAmount, 2),
            'pay_amount' => $payrollDetail->pay_amount,
            'pay_type' => $payrollDetail->pay_type->value,
        ];
    }

    /**
     * Get employee tax summary for a specific year
     */
    public function getEmployeeTaxSummary(User $employee, int $year): array
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (! $payrollDetail || ! $payrollDetail->enable_tax_calculations) {
            return [
                'has_tax_data' => false,
                'year' => $year,
            ];
        }

        return [
            'has_tax_data' => true,
            'year' => $year,
            'employment_details' => [
                'position' => $payrollDetail->position_title,
                'employment_period' => 'Full year',
                'pay_type' => $payrollDetail->pay_type->label(),
            ],
            'tax_handling' => $payrollDetail->tax_handling->label(),
            'enable_tax_calculations' => $payrollDetail->enable_tax_calculations,
        ];
    }
}
