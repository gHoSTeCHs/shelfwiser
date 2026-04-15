<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeCustomDeductionRequest;
use App\Http\Requests\UpdateEmployeeCustomDeductionRequest;
use App\Models\EmployeeCustomDeduction;
use App\Models\User;
use App\Services\EmployeeCustomDeductionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeCustomDeductionController extends Controller
{
    public function __construct(
        private readonly EmployeeCustomDeductionService $service
    ) {}

    public function index(User $employee): Response
    {
        Gate::authorize('viewPayrollDetails', $employee);

        return Inertia::render('Staff/Deductions/Index', [
            'employee' => $employee->only(['id', 'name', 'email']),
            'deductions' => $this->service->getDeductionsForEmployee($employee),
            'deductionTypes' => $this->service->getDeductionTypeOptions(),
        ]);
    }

    public function create(User $employee): Response
    {
        Gate::authorize('updatePayrollDetails', $employee);

        return Inertia::render('Staff/Deductions/Create', [
            'employee' => $employee->only(['id', 'name', 'email']),
            'deductionTypes' => $this->service->getDeductionTypeOptions(),
        ]);
    }

    public function store(StoreEmployeeCustomDeductionRequest $request, User $employee): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);

        $this->service->createDeduction($employee, $request->validated());

        return redirect()
            ->route('users.deductions.index', $employee)
            ->with('success', 'Custom deduction created successfully');
    }

    public function edit(User $employee, EmployeeCustomDeduction $deduction): Response
    {
        Gate::authorize('updatePayrollDetails', $employee);

        return Inertia::render('Staff/Deductions/Edit', [
            'employee' => $employee->only(['id', 'name', 'email']),
            'deduction' => $deduction,
            'deductionTypes' => $this->service->getDeductionTypeOptions(),
        ]);
    }

    public function update(UpdateEmployeeCustomDeductionRequest $request, User $employee, EmployeeCustomDeduction $deduction): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);
        Gate::authorize('manage', [$deduction, $employee]);

        $this->service->updateDeduction($deduction, $request->validated());

        return redirect()
            ->route('users.deductions.index', $employee)
            ->with('success', 'Custom deduction updated successfully');
    }

    public function destroy(User $employee, EmployeeCustomDeduction $deduction): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);
        Gate::authorize('manage', [$deduction, $employee]);

        $this->service->deleteDeduction($deduction);

        return redirect()
            ->route('users.deductions.index', $employee)
            ->with('success', 'Custom deduction deleted successfully');
    }

    public function toggleStatus(User $employee, EmployeeCustomDeduction $deduction): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);
        Gate::authorize('manage', [$deduction, $employee]);

        $status = $this->service->toggleDeductionStatus($deduction);

        return redirect()
            ->back()
            ->with('success', "Custom deduction {$status} successfully");
    }
}
