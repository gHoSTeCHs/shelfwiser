<?php

namespace App\Http\Controllers;

use App\Enums\DeductionCalculationBase;
use App\Enums\DeductionCalculationType;
use App\Enums\DeductionCategory;
use App\Enums\EarningCalculationType;
use App\Enums\EarningCategory;
use App\Enums\PayFrequency;
use App\Enums\TaxLawVersion;
use App\Http\Requests\CompareTaxLawsRequest;
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

        try {
            $this->payrollSettingsService->updateEarningType($earningType, $request->validated(), $request->user());
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('payroll.settings.earning-types')
            ->with('success', 'Earning type updated successfully.');
    }

    public function deleteEarningType(Request $request, EarningType $earningType): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        try {
            $this->payrollSettingsService->deleteEarningType($earningType, $request->user());
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

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

        try {
            $this->payrollSettingsService->updateDeductionType($deductionType, $request->validated(), $request->user());
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('payroll.settings.deduction-types')
            ->with('success', 'Deduction type updated successfully.');
    }

    public function deleteDeductionType(Request $request, DeductionTypeModel $deductionType): RedirectResponse
    {
        Gate::authorize('manage_payroll_settings');

        try {
            $this->payrollSettingsService->deleteDeductionType($deductionType, $request->user());
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

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

        try {
            $this->payrollSettingsService->deletePayCalendar($payCalendar, $request->user());
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

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

        return Inertia::render('Payroll/Settings/TaxTableShow', [
            'taxTable' => $this->payrollSettingsService->prepareTaxTableForShow($taxTable),
        ]);
    }

    public function compareTaxLaws(CompareTaxLawsRequest $request): JsonResponse
    {
        Gate::authorize('view_payroll_settings');

        $annualSalary = (float) ($request->validated('annual_salary') ?? 1200000);

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
