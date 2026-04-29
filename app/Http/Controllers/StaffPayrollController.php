<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffPayrollRequest;
use App\Http\Requests\UpdateDeductionPreferencesRequest;
use App\Http\Requests\UpdateStaffTaxHandlingRequest;
use App\Models\User;
use App\Services\EmployeePayrollService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class StaffPayrollController extends Controller
{
    public function __construct(
        private EmployeePayrollService $payrollService
    ) {}

    public function store(StoreStaffPayrollRequest $request, User $employee): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);

        $isNew = $employee->employeePayrollDetail === null;

        $this->payrollService->updatePayrollDetails($employee, $request->validated());

        $message = $isNew ? 'Payroll details created successfully' : 'Payroll details updated successfully';

        return redirect()
            ->route('staff.show', $employee)
            ->with('success', $message);
    }

    public function updateDeductions(UpdateDeductionPreferencesRequest $request, User $employee): RedirectResponse
    {
        Gate::authorize('updateDeductionPreferences', $employee);

        $this->payrollService->updatePayrollDetails($employee, $request->validated());

        return redirect()
            ->back()
            ->with('success', 'Deduction preferences updated successfully');
    }

    public function updateTaxSettings(UpdateStaffTaxHandlingRequest $request, User $employee): RedirectResponse
    {
        Gate::authorize('updateTaxSettings', $employee);

        $this->payrollService->updatePayrollDetails($employee, $request->validated());

        return redirect()
            ->back()
            ->with('success', 'Tax settings updated successfully');
    }
}
