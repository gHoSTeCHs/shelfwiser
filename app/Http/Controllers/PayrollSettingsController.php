<?php

namespace App\Http\Controllers;

use App\Enums\DeductionCalculationBase;
use App\Enums\DeductionCalculationType;
use App\Enums\DeductionCategory;
use App\Enums\EarningCalculationType;
use App\Enums\EarningCategory;
use App\Enums\PayFrequency;
use App\Enums\TaxLawVersion;
use App\Http\Requests\EstimateTaxRequest;
use App\Http\Requests\StoreDeductionTypeRequest;
use App\Http\Requests\StoreEarningTypeRequest;
use App\Http\Requests\StorePayCalendarRequest;
use App\Http\Requests\UpdateDeductionTypeRequest;
use App\Http\Requests\UpdateEarningTypeRequest;
use App\Http\Requests\UpdatePayCalendarRequest;
use App\Models\DeductionTypeModel;
use App\Models\EarningType;
use App\Models\PayCalendar;
use App\Models\TaxTable;
use App\Services\PayrollSettingsService;
use App\Services\TaxCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayrollSettingsController extends Controller
{
    public function __construct(
        private readonly PayrollSettingsService $payrollSettingsService,
        private readonly TaxCalculationService $taxCalculationService
    ) {}

    public function earningTypes(): Response
    {
        Gate::authorize('view_payroll_settings');

        return Inertia::render('Payroll/Settings/EarningTypes', [
            'earningTypes' => $this->payrollSettingsService->getEarningTypes(),
            'categories' => EarningCategory::options(),
            'calculationTypes' => EarningCalculationType::options(),
        ]);
    }

    public function storeEarningType(StoreEarningTypeRequest $request): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        $this->payrollSettingsService->createEarningType($request->validated(), $request->user());

        return redirect()->route('payroll.settings.earning-types')
            ->with('success', 'Earning type created successfully.');
    }

    public function updateEarningType(UpdateEarningTypeRequest $request, EarningType $earningType): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        if ($earningType->is_system) {
            return back()->with('error', 'System earning types cannot be modified.');
        }

        $this->payrollSettingsService->updateEarningType($earningType, $request->validated(), $request->user());

        return redirect()->route('payroll.settings.earning-types')
            ->with('success', 'Earning type updated successfully.');
    }

    public function deleteEarningType(Request $request, EarningType $earningType): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        if ($earningType->is_system) {
            return back()->with('error', 'System earning types cannot be deleted.');
        }

        if ($earningType->employeeEarnings()->exists()) {
            return back()->with('error', 'Cannot delete earning type that is in use.');
        }

        $this->payrollSettingsService->deleteEarningType($earningType, $request->user());

        return redirect()->route('payroll.settings.earning-types')
            ->with('success', 'Earning type deleted successfully.');
    }

    public function deductionTypes(): Response
    {
        Gate::authorize('view_payroll_settings');

        return Inertia::render('Payroll/Settings/DeductionTypes', [
            'deductionTypes' => $this->payrollSettingsService->getDeductionTypes(),
            'categories' => DeductionCategory::options(),
            'calculationTypes' => DeductionCalculationType::options(),
            'calculationBases' => DeductionCalculationBase::options(),
        ]);
    }

    public function storeDeductionType(StoreDeductionTypeRequest $request): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        $this->payrollSettingsService->createDeductionType($request->validated(), $request->user());

        return redirect()->route('payroll.settings.deduction-types')
            ->with('success', 'Deduction type created successfully.');
    }

    public function updateDeductionType(UpdateDeductionTypeRequest $request, DeductionTypeModel $deductionType): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        if ($deductionType->is_system) {
            return back()->with('error', 'System deduction types cannot be modified.');
        }

        $this->payrollSettingsService->updateDeductionType($deductionType, $request->validated(), $request->user());

        return redirect()->route('payroll.settings.deduction-types')
            ->with('success', 'Deduction type updated successfully.');
    }

    public function deleteDeductionType(Request $request, DeductionTypeModel $deductionType): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        if ($deductionType->is_system) {
            return back()->with('error', 'System deduction types cannot be deleted.');
        }

        if ($deductionType->employeeDeductions()->exists()) {
            return back()->with('error', 'Cannot delete deduction type that is in use.');
        }

        $this->payrollSettingsService->deleteDeductionType($deductionType, $request->user());

        return redirect()->route('payroll.settings.deduction-types')
            ->with('success', 'Deduction type deleted successfully.');
    }

    public function payCalendars(): Response
    {
        Gate::authorize('view_payroll_settings');

        return Inertia::render('Payroll/Settings/PayCalendars', [
            'payCalendars' => $this->payrollSettingsService->getPayCalendars(),
            'frequencies' => PayFrequency::options(),
        ]);
    }

    public function storePayCalendar(StorePayCalendarRequest $request): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        $this->payrollSettingsService->createPayCalendar($request->validated(), $request->user());

        return redirect()->route('payroll.settings.pay-calendars')
            ->with('success', 'Pay calendar created successfully.');
    }

    public function updatePayCalendar(UpdatePayCalendarRequest $request, PayCalendar $payCalendar): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        $this->payrollSettingsService->updatePayCalendar($payCalendar, $request->validated(), $request->user());

        return redirect()->route('payroll.settings.pay-calendars')
            ->with('success', 'Pay calendar updated successfully.');
    }

    public function deletePayCalendar(Request $request, PayCalendar $payCalendar): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        if ($payCalendar->employees()->exists()) {
            return back()->with('error', 'Cannot delete pay calendar with assigned employees.');
        }

        if ($payCalendar->payPeriods()->exists()) {
            return back()->with('error', 'Cannot delete pay calendar with existing pay periods.');
        }

        $this->payrollSettingsService->deletePayCalendar($payCalendar, $request->user());

        return redirect()->route('payroll.settings.pay-calendars')
            ->with('success', 'Pay calendar deleted successfully.');
    }

    public function taxSettings(): Response
    {
        Gate::authorize('view_payroll_settings');

        $taxData = $this->payrollSettingsService->getTaxSettings($this->tenantId());

        return Inertia::render('Payroll/Settings/TaxSettings', [
            'taxTables' => $taxData['taxTables'],
            'activeTaxTable' => $taxData['currentTable'],
            'taxLawVersions' => TaxLawVersion::options(),
            'nta2025Countdown' => $taxData['nta2025Countdown'],
        ]);
    }

    public function showTaxTable(TaxTable $taxTable): Response
    {
        Gate::authorize('view_payroll_settings');

        abort_if(! $taxTable->is_system && $taxTable->tenant_id !== $this->tenantId(), 403);

        $taxTable->load(['bands' => fn ($q) => $q->orderBy('band_order'), 'reliefs']);
        $taxTable->tax_law_version_label = $taxTable->getTaxLawVersion()?->shortLabel();

        return Inertia::render('Payroll/Settings/TaxTableShow', [
            'taxTable' => $taxTable,
        ]);
    }

    public function compareTaxLaws(Request $request): JsonResponse
    {
        Gate::authorize('view_payroll_settings');

        $annualSalary = $request->input('annual_salary', 1200000);

        return response()->json(
            $this->taxCalculationService->compareTaxLaws($annualSalary, $this->tenantId())
        );
    }

    public function estimateTax(EstimateTaxRequest $request): JsonResponse
    {
        Gate::authorize('view_payroll_settings');

        return response()->json(
            $this->payrollSettingsService->estimateTax(
                $request->validated(),
                $this->tenantId(),
                $this->taxCalculationService
            )
        );
    }

    private function tenantId(): int
    {
        return auth()->user()->tenant_id;
    }
}
