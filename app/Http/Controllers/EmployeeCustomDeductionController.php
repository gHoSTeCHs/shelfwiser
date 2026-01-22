<?php

namespace App\Http\Controllers;

use App\Enums\DeductionType;
use App\Models\EmployeeCustomDeduction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeCustomDeductionController extends Controller
{
    /**
     * Display a listing of custom deductions for an employee
     */
    public function index(Request $request, User $employee): Response
    {
        Gate::authorize('viewPayrollDetails', $employee);

        $deductions = EmployeeCustomDeduction::forTenant(auth()->user()->tenant_id)
            ->forUser($employee->id)
            ->with(['user:id,name,email'])
            ->latest()
            ->get();

        return Inertia::render('Staff/Deductions/Index', [
            'employee' => $employee->only(['id', 'name', 'email']),
            'deductions' => $deductions,
            'deductionTypes' => collect(DeductionType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new custom deduction
     */
    public function create(Request $request, User $employee): Response
    {
        Gate::authorize('updatePayrollDetails', $employee);

        return Inertia::render('Staff/Deductions/Create', [
            'employee' => $employee->only(['id', 'name', 'email']),
            'deductionTypes' => collect(DeductionType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    /**
     * Store a newly created custom deduction
     */
    public function store(Request $request, User $employee): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);

        $validated = $request->validate([
            'deduction_name' => ['required', 'string', 'max:255'],
            'deduction_type' => ['required', Rule::in(array_column(DeductionType::cases(), 'value'))],
            'amount' => ['required_if:deduction_type,fixed_amount,loan_repayment,advance_repayment,insurance,union_dues,savings,other', 'nullable', 'numeric', 'min:0'],
            'percentage' => ['required_if:deduction_type,percentage', 'nullable', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after:effective_from'],
        ]);

        $deduction = EmployeeCustomDeduction::create([
            'user_id' => $employee->id,
            'tenant_id' => auth()->user()->tenant_id,
            'deduction_name' => $validated['deduction_name'],
            'deduction_type' => $validated['deduction_type'],
            'amount' => $validated['amount'] ?? 0,
            'percentage' => $validated['percentage'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'] ?? null,
        ]);

        return redirect()
            ->route('users.deductions.index', $employee)
            ->with('success', 'Custom deduction created successfully');
    }

    /**
     * Show the form for editing a custom deduction
     */
    public function edit(Request $request, User $employee, EmployeeCustomDeduction $deduction): Response
    {
        Gate::authorize('updatePayrollDetails', $employee);

        // Ensure deduction belongs to this employee and tenant
        if ($deduction->user_id !== $employee->id || $deduction->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        return Inertia::render('Staff/Deductions/Edit', [
            'employee' => $employee->only(['id', 'name', 'email']),
            'deduction' => $deduction,
            'deductionTypes' => collect(DeductionType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    /**
     * Update the specified custom deduction
     */
    public function update(Request $request, User $employee, EmployeeCustomDeduction $deduction): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);

        // Ensure deduction belongs to this employee and tenant
        if ($deduction->user_id !== $employee->id || $deduction->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'deduction_name' => ['required', 'string', 'max:255'],
            'deduction_type' => ['required', Rule::in(array_column(DeductionType::cases(), 'value'))],
            'amount' => ['required_if:deduction_type,fixed_amount,loan_repayment,advance_repayment,insurance,union_dues,savings,other', 'nullable', 'numeric', 'min:0'],
            'percentage' => ['required_if:deduction_type,percentage', 'nullable', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after:effective_from'],
        ]);

        $deduction->update([
            'deduction_name' => $validated['deduction_name'],
            'deduction_type' => $validated['deduction_type'],
            'amount' => $validated['amount'] ?? 0,
            'percentage' => $validated['percentage'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'] ?? null,
        ]);

        return redirect()
            ->route('users.deductions.index', $employee)
            ->with('success', 'Custom deduction updated successfully');
    }

    /**
     * Remove the specified custom deduction
     */
    public function destroy(User $employee, EmployeeCustomDeduction $deduction): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);

        // Ensure deduction belongs to this employee and tenant
        if ($deduction->user_id !== $employee->id || $deduction->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $deduction->delete();

        return redirect()
            ->route('users.deductions.index', $employee)
            ->with('success', 'Custom deduction deleted successfully');
    }

    /**
     * Toggle deduction active status
     */
    public function toggleStatus(User $employee, EmployeeCustomDeduction $deduction): RedirectResponse
    {
        Gate::authorize('updatePayrollDetails', $employee);

        // Ensure deduction belongs to this employee and tenant
        if ($deduction->user_id !== $employee->id || $deduction->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $deduction->update([
            'is_active' => ! $deduction->is_active,
        ]);

        $status = $deduction->is_active ? 'activated' : 'deactivated';

        return redirect()
            ->back()
            ->with('success', "Custom deduction {$status} successfully");
    }
}
