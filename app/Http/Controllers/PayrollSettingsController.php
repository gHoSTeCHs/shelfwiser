<?php

namespace App\Http\Controllers;

use App\Models\EarningType;
use App\Models\DeductionTypeModel;
use App\Models\PayCalendar;
use App\Models\TaxTable;
use App\Services\PayrollAuditService;
use App\Enums\EarningCategory;
use App\Enums\EarningCalculationType;
use App\Enums\DeductionCategory;
use App\Enums\DeductionCalculationType;
use App\Enums\DeductionCalculationBase;
use App\Enums\PayFrequency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayrollSettingsController extends Controller
{
    public function __construct(
        protected PayrollAuditService $auditService
    ) {}

    public function earningTypes(): Response
    {
        Gate::authorize('view_payroll_settings');

        $tenantId = auth()->user()->tenant_id;

        $earningTypes = EarningType::forTenant($tenantId)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Payroll/Settings/EarningTypes', [
            'earningTypes' => $earningTypes,
            'categories' => EarningCategory::options(),
            'calculationTypes' => EarningCalculationType::options(),
        ]);
    }

    public function storeEarningType(Request $request)
    {
        Gate::authorize('manage_payroll_settings');

        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'category' => 'required|string',
            'calculation_type' => 'required|string',
            'default_amount' => 'nullable|numeric|min:0',
            'default_rate' => 'nullable|numeric|min:0|max:100',
            'is_taxable' => 'boolean',
            'is_pensionable' => 'boolean',
            'is_recurring' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer|min:0',
        ], [
            'code.required' => 'The earning code is required.',
            'code.max' => 'The earning code must not exceed 20 characters.',
            'name.required' => 'The earning name is required.',
            'name.max' => 'The earning name must not exceed 100 characters.',
            'category.required' => 'Please select a category.',
            'calculation_type.required' => 'Please select a calculation type.',
            'default_amount.min' => 'The default amount must be at least 0.',
            'default_rate.min' => 'The default rate must be at least 0.',
            'default_rate.max' => 'The default rate must not exceed 100.',
        ]);

        $tenantId = auth()->user()->tenant_id;

        $existingCode = EarningType::forTenant($tenantId)
            ->where('code', $validated['code'])
            ->exists();

        if ($existingCode) {
            return back()->withErrors(['code' => 'This code is already in use.']);
        }

        $earningType = EarningType::create([
            'tenant_id' => $tenantId,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'calculation_type' => $validated['calculation_type'],
            'default_amount' => $validated['default_amount'] ?? 0,
            'default_rate' => $validated['default_rate'] ?? 0,
            'is_taxable' => $validated['is_taxable'] ?? true,
            'is_pensionable' => $validated['is_pensionable'] ?? true,
            'is_recurring' => $validated['is_recurring'] ?? true,
            'is_system' => false,
            'is_active' => $validated['is_active'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        $this->auditService->logEarningTypeCreated($earningType, auth()->user());

        return redirect()->route('payroll.settings.earning-types')
            ->with('success', 'Earning type created successfully.');
    }

    public function updateEarningType(Request $request, EarningType $earningType)
    {
        Gate::authorize('manage_payroll_settings');

        $this->authorizeEarningType($earningType);

        if ($earningType->is_system) {
            return back()->with('error', 'System earning types cannot be modified.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'category' => 'required|string',
            'calculation_type' => 'required|string',
            'default_amount' => 'nullable|numeric|min:0',
            'default_rate' => 'nullable|numeric|min:0|max:100',
            'is_taxable' => 'boolean',
            'is_pensionable' => 'boolean',
            'is_recurring' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'nullable|integer|min:0',
        ]);

        $oldValues = $earningType->only(array_keys($validated));

        $earningType->update($validated);

        $this->auditService->logEarningTypeUpdated($earningType, $oldValues, auth()->user());

        return redirect()->route('payroll.settings.earning-types')
            ->with('success', 'Earning type updated successfully.');
    }

    public function deleteEarningType(EarningType $earningType)
    {
        Gate::authorize('manage_payroll_settings');

        $this->authorizeEarningType($earningType);

        if ($earningType->is_system) {
            return back()->with('error', 'System earning types cannot be deleted.');
        }

        if ($earningType->employeeEarnings()->exists()) {
            return back()->with('error', 'Cannot delete earning type that is in use.');
        }

        $this->auditService->logEarningTypeDeleted($earningType, auth()->user());

        $earningType->delete();

        return redirect()->route('payroll.settings.earning-types')
            ->with('success', 'Earning type deleted successfully.');
    }

    public function deductionTypes(): Response
    {
        Gate::authorize('view_payroll_settings');

        $tenantId = auth()->user()->tenant_id;

        $deductionTypes = DeductionTypeModel::forTenant($tenantId)
            ->orderedByPriority()
            ->get();

        return Inertia::render('Payroll/Settings/DeductionTypes', [
            'deductionTypes' => $deductionTypes,
            'categories' => DeductionCategory::options(),
            'calculationTypes' => DeductionCalculationType::options(),
            'calculationBases' => DeductionCalculationBase::options(),
        ]);
    }

    public function storeDeductionType(Request $request)
    {
        Gate::authorize('manage_payroll_settings');

        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'category' => 'required|string',
            'calculation_type' => 'required|string',
            'calculation_base' => 'nullable|string',
            'default_amount' => 'nullable|numeric|min:0',
            'default_rate' => 'nullable|numeric|min:0|max:100',
            'max_amount' => 'nullable|numeric|min:0',
            'annual_cap' => 'nullable|numeric|min:0',
            'is_pre_tax' => 'boolean',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'priority' => 'nullable|integer|min:0',
        ], [
            'code.required' => 'The deduction code is required.',
            'code.max' => 'The deduction code must not exceed 20 characters.',
            'name.required' => 'The deduction name is required.',
            'name.max' => 'The deduction name must not exceed 100 characters.',
            'category.required' => 'Please select a category.',
            'calculation_type.required' => 'Please select a calculation type.',
            'default_amount.min' => 'The default amount must be at least 0.',
            'default_rate.min' => 'The default rate must be at least 0.',
            'default_rate.max' => 'The default rate must not exceed 100.',
            'max_amount.min' => 'The maximum amount must be at least 0.',
            'annual_cap.min' => 'The annual cap must be at least 0.',
        ]);

        $tenantId = auth()->user()->tenant_id;

        $existingCode = DeductionTypeModel::forTenant($tenantId)
            ->where('code', $validated['code'])
            ->exists();

        if ($existingCode) {
            return back()->withErrors(['code' => 'This code is already in use.']);
        }

        $deductionType = DeductionTypeModel::create([
            'tenant_id' => $tenantId,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'calculation_type' => $validated['calculation_type'],
            'calculation_base' => $validated['calculation_base'] ?? DeductionCalculationBase::GROSS->value,
            'default_amount' => $validated['default_amount'] ?? 0,
            'default_rate' => $validated['default_rate'] ?? 0,
            'max_amount' => $validated['max_amount'] ?? null,
            'annual_cap' => $validated['annual_cap'] ?? null,
            'is_pre_tax' => $validated['is_pre_tax'] ?? false,
            'is_mandatory' => $validated['is_mandatory'] ?? false,
            'is_system' => false,
            'is_active' => $validated['is_active'] ?? true,
            'priority' => $validated['priority'] ?? 100,
        ]);

        $this->auditService->logDeductionTypeCreated($deductionType, auth()->user());

        return redirect()->route('payroll.settings.deduction-types')
            ->with('success', 'Deduction type created successfully.');
    }

    public function updateDeductionType(Request $request, DeductionTypeModel $deductionType)
    {
        Gate::authorize('manage_payroll_settings');

        $this->authorizeDeductionType($deductionType);

        if ($deductionType->is_system) {
            return back()->with('error', 'System deduction types cannot be modified.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'category' => 'required|string',
            'calculation_type' => 'required|string',
            'calculation_base' => 'nullable|string',
            'default_amount' => 'nullable|numeric|min:0',
            'default_rate' => 'nullable|numeric|min:0|max:100',
            'max_amount' => 'nullable|numeric|min:0',
            'annual_cap' => 'nullable|numeric|min:0',
            'is_pre_tax' => 'boolean',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'priority' => 'nullable|integer|min:0',
        ]);

        $oldValues = $deductionType->only(array_keys($validated));

        $deductionType->update($validated);

        $this->auditService->logDeductionTypeUpdated($deductionType, $oldValues, auth()->user());

        return redirect()->route('payroll.settings.deduction-types')
            ->with('success', 'Deduction type updated successfully.');
    }

    public function deleteDeductionType(DeductionTypeModel $deductionType)
    {
        Gate::authorize('manage_payroll_settings');

        $this->authorizeDeductionType($deductionType);

        if ($deductionType->is_system) {
            return back()->with('error', 'System deduction types cannot be deleted.');
        }

        if ($deductionType->employeeDeductions()->exists()) {
            return back()->with('error', 'Cannot delete deduction type that is in use.');
        }

        $this->auditService->logDeductionTypeDeleted($deductionType, auth()->user());

        $deductionType->delete();

        return redirect()->route('payroll.settings.deduction-types')
            ->with('success', 'Deduction type deleted successfully.');
    }

    public function payCalendars(): Response
    {
        Gate::authorize('view_payroll_settings');

        $tenantId = auth()->user()->tenant_id;

        $payCalendars = PayCalendar::forTenant($tenantId)
            ->withCount('employees')
            ->orderBy('name')
            ->get();

        return Inertia::render('Payroll/Settings/PayCalendars', [
            'payCalendars' => $payCalendars,
            'frequencies' => PayFrequency::options(),
        ]);
    }

    public function storePayCalendar(Request $request)
    {
        Gate::authorize('manage_payroll_settings');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'frequency' => 'required|string',
            'pay_day' => 'required|integer|min:1|max:31',
            'cutoff_day' => 'nullable|integer|min:1|max:31',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'The calendar name is required.',
            'name.max' => 'The calendar name must not exceed 100 characters.',
            'frequency.required' => 'Please select a pay frequency.',
            'pay_day.required' => 'The pay day is required.',
            'pay_day.min' => 'The pay day must be between 1 and 31.',
            'pay_day.max' => 'The pay day must be between 1 and 31.',
            'cutoff_day.min' => 'The cutoff day must be between 1 and 31.',
            'cutoff_day.max' => 'The cutoff day must be between 1 and 31.',
        ]);

        $tenantId = auth()->user()->tenant_id;

        if ($validated['is_default'] ?? false) {
            PayCalendar::forTenant($tenantId)->update(['is_default' => false]);
        }

        $payCalendar = PayCalendar::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'frequency' => $validated['frequency'],
            'pay_day' => $validated['pay_day'],
            'cutoff_day' => $validated['cutoff_day'] ?? null,
            'is_default' => $validated['is_default'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->auditService->logPayCalendarCreated($payCalendar, auth()->user());

        return redirect()->route('payroll.settings.pay-calendars')
            ->with('success', 'Pay calendar created successfully.');
    }

    public function updatePayCalendar(Request $request, PayCalendar $payCalendar)
    {
        Gate::authorize('manage_payroll_settings');

        $this->authorizePayCalendar($payCalendar);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'frequency' => 'required|string',
            'pay_day' => 'required|integer|min:1|max:31',
            'cutoff_day' => 'nullable|integer|min:1|max:31',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $tenantId = auth()->user()->tenant_id;

        if ($validated['is_default'] ?? false) {
            PayCalendar::forTenant($tenantId)
                ->where('id', '!=', $payCalendar->id)
                ->update(['is_default' => false]);
        }

        $oldValues = $payCalendar->only(array_keys($validated));

        $payCalendar->update($validated);

        $this->auditService->logPayCalendarUpdated($payCalendar, $oldValues, auth()->user());

        return redirect()->route('payroll.settings.pay-calendars')
            ->with('success', 'Pay calendar updated successfully.');
    }

    public function deletePayCalendar(PayCalendar $payCalendar)
    {
        Gate::authorize('manage_payroll_settings');

        $this->authorizePayCalendar($payCalendar);

        if ($payCalendar->employees()->exists()) {
            return back()->with('error', 'Cannot delete pay calendar with assigned employees.');
        }

        if ($payCalendar->payPeriods()->exists()) {
            return back()->with('error', 'Cannot delete pay calendar with existing pay periods.');
        }

        $this->auditService->logPayCalendarDeleted($payCalendar, auth()->user());

        $payCalendar->delete();

        return redirect()->route('payroll.settings.pay-calendars')
            ->with('success', 'Pay calendar deleted successfully.');
    }

    public function taxSettings(): Response
    {
        Gate::authorize('view_payroll_settings');

        $taxTables = TaxTable::active()
            ->with(['bands' => function ($q) {
                $q->orderBy('lower_limit');
            }, 'reliefs'])
            ->orderByDesc('effective_from')
            ->get();

        return Inertia::render('Payroll/Settings/TaxSettings', [
            'taxTables' => $taxTables,
        ]);
    }

    protected function authorizeEarningType(EarningType $earningType): void
    {
        if ($earningType->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }
    }

    protected function authorizeDeductionType(DeductionTypeModel $deductionType): void
    {
        if ($deductionType->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }
    }

    protected function authorizePayCalendar(PayCalendar $payCalendar): void
    {
        if ($payCalendar->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }
    }
}
