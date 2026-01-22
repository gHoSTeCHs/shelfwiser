<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateEmployeeTaxSettingsRequest;
use App\Models\EmployeeTaxSetting;
use App\Models\TaxTable;
use App\Models\User;
use App\Services\TaxCalculationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeTaxSettingsController extends Controller
{
    public function __construct(
        protected TaxCalculationService $taxService
    ) {}

    /**
     * Display the employee's tax settings.
     */
    public function show(Request $request, User $user): Response
    {
        Gate::authorize('view', $user);

        $taxSettings = $user->taxSettings ?? new EmployeeTaxSetting([
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
        ]);

        $taxTable = TaxTable::getActiveTableForDate($user->tenant_id);
        $availableReliefs = $taxTable?->reliefs()
            ->where('is_active', true)
            ->where('is_automatic', false)
            ->get() ?? collect();

        $taxSummary = $this->taxService->getTaxSummaryForEmployee($user);

        return Inertia::render('Staff/TaxSettings', [
            'employee' => $user->only(['id', 'name', 'email']),
            'taxSettings' => $taxSettings,
            'availableReliefs' => $availableReliefs,
            'taxSummary' => $taxSummary,
            'taxLawVersion' => $taxTable?->getTaxLawVersion()?->value,
            'taxLawLabel' => $taxTable?->getTaxLawVersion()?->shortLabel(),
        ]);
    }

    /**
     * Update the employee's tax settings.
     */
    public function update(UpdateEmployeeTaxSettingsRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $validated = $request->validated();

        $taxSettings = $user->taxSettings ?? new EmployeeTaxSetting([
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
        ]);

        $taxSettings->fill([
            'tax_id_number' => $validated['tax_id_number'] ?? $taxSettings->tax_id_number,
            'tax_state' => $validated['tax_state'] ?? $taxSettings->tax_state,
            'is_tax_exempt' => $validated['is_tax_exempt'] ?? false,
            'exemption_reason' => $validated['exemption_reason'] ?? null,
            'exemption_expires_at' => $validated['exemption_expires_at'] ?? null,
            'is_homeowner' => $validated['is_homeowner'] ?? false,
            'annual_rent_paid' => $validated['annual_rent_paid'] ?? null,
            'active_reliefs' => $validated['active_reliefs'] ?? [],
        ]);

        $taxSettings->save();

        return redirect()->back()->with('success', 'Tax settings updated successfully.');
    }

    /**
     * Upload rent proof document.
     */
    public function uploadRentProof(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $request->validate([
            'rent_proof_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'rent_proof_expiry' => ['nullable', 'date', 'after:today'],
        ]);

        $taxSettings = $user->taxSettings;

        if (! $taxSettings) {
            $taxSettings = EmployeeTaxSetting::create([
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
            ]);
        }

        if ($taxSettings->rent_proof_document) {
            Storage::disk('tenant')->delete($taxSettings->rent_proof_document);
        }

        $path = $request->file('rent_proof_document')->store(
            "tenants/{$user->tenant_id}/tax-documents/{$user->id}",
            'tenant'
        );

        $taxSettings->updateRentProof(
            $path,
            $request->input('rent_proof_expiry') ? \Carbon\Carbon::parse($request->input('rent_proof_expiry')) : null
        );

        return redirect()->back()->with('success', 'Rent proof document uploaded successfully.');
    }

    /**
     * Remove rent proof document.
     */
    public function deleteRentProof(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $taxSettings = $user->taxSettings;

        if ($taxSettings && $taxSettings->rent_proof_document) {
            Storage::disk('tenant')->delete($taxSettings->rent_proof_document);

            $taxSettings->update([
                'rent_proof_document' => null,
                'rent_proof_expiry' => null,
            ]);
        }

        return redirect()->back()->with('success', 'Rent proof document removed.');
    }

    /**
     * Preview tax calculation for employee.
     */
    public function previewTax(Request $request, User $user): \Illuminate\Http\JsonResponse
    {
        Gate::authorize('view', $user);

        $effectiveDate = $request->input('effective_date')
            ? \Carbon\Carbon::parse($request->input('effective_date'))
            : null;

        $taxSummary = $this->taxService->getTaxSummaryForEmployee($user, $effectiveDate);

        return response()->json($taxSummary);
    }

    /**
     * Compare tax under different tax law versions.
     */
    public function compareTaxLaws(Request $request, User $user): \Illuminate\Http\JsonResponse
    {
        Gate::authorize('view', $user);

        $payrollDetails = $user->employeePayrollDetail;

        if (! $payrollDetails) {
            return response()->json(['error' => 'Employee has no payroll details'], 422);
        }

        $annualSalary = (float) $payrollDetails->basic_salary * 12;
        $comparison = $this->taxService->compareTaxLaws($annualSalary, $user->tenant_id);

        return response()->json($comparison);
    }
}
