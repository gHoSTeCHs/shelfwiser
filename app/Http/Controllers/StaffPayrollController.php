<?php

namespace App\Http\Controllers;

use App\Enums\EmploymentType;
use App\Enums\PayFrequency;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use App\Models\User;
use App\Services\EmployeePayrollService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StaffPayrollController extends Controller
{
    public function __construct(
        private EmployeePayrollService $payrollService
    ) {}

    /**
     * Store or update payroll details for an employee
     */
    public function store(Request $request, User $employee): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);

        $validated = $request->validate([
            'employment_type' => ['required', Rule::in(array_column(EmploymentType::cases(), 'value'))],
            'pay_type' => ['required', Rule::in(array_column(PayType::cases(), 'value'))],
            'pay_amount' => ['required', 'numeric', 'min:0'],
            'pay_frequency' => ['required', Rule::in(array_column(PayFrequency::cases(), 'value'))],
            'tax_handling' => ['required', Rule::in(array_column(TaxHandling::cases(), 'value'))],
            'enable_tax_calculations' => ['nullable', 'boolean'],
            'tax_id_number' => ['nullable', 'string', 'max:255'],
            'pension_enabled' => ['nullable', 'boolean'],
            'pension_employee_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'pension_employer_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'nhf_enabled' => ['nullable', 'boolean'],
            'nhf_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'nhis_enabled' => ['nullable', 'boolean'],
            'nhis_amount' => ['nullable', 'numeric', 'min:0'],
            'other_deductions_enabled' => ['nullable', 'boolean'],
            'bank_account_number' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'routing_number' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:255'],
            'position_title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
        ]);

        if ($employee->employeePayrollDetail) {
            $this->payrollService->updatePayrollDetails($employee, $validated);
            $message = 'Payroll details updated successfully';
        } else {
            $this->payrollService->createEmployeePayroll($employee, $validated);
            $message = 'Payroll details created successfully';
        }

        return redirect()
            ->route('staff.show', $employee)
            ->with('success', $message);
    }

    /**
     * Update employee deduction preferences
     */
    public function updateDeductions(Request $request, User $employee): RedirectResponse
    {
        Gate::authorize('updateDeductionPreferences', $employee);

        $validated = $request->validate([
            'pension_enabled' => ['nullable', 'boolean'],
            'nhf_enabled' => ['nullable', 'boolean'],
            'nhis_enabled' => ['nullable', 'boolean'],
            'nhis_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $this->payrollService->updatePayrollDetails($employee, $validated);

        return redirect()
            ->back()
            ->with('success', 'Deduction preferences updated successfully');
    }

    /**
     * Update employee tax settings
     */
    public function updateTaxSettings(Request $request, User $employee): RedirectResponse
    {
        Gate::authorize('updateTaxSettings', $employee);

        $validated = $request->validate([
            'enable_tax_calculations' => ['required', 'boolean'],
            'tax_handling' => ['required', Rule::in(array_column(TaxHandling::cases(), 'value'))],
            'tax_id_number' => ['nullable', 'string', 'max:255'],
        ]);

        $this->payrollService->updatePayrollDetails($employee, $validated);

        return redirect()
            ->back()
            ->with('success', 'Tax settings updated successfully');
    }
}
