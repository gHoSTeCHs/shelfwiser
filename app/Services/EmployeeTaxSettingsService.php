<?php

namespace App\Services;

use App\Models\EmployeeTaxSetting;
use App\Models\TaxTable;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class EmployeeTaxSettingsService
{
    public function __construct(
        protected TaxCalculationService $taxCalculationService
    ) {}

    public function getDisplayData(User $user): array
    {
        $taxSettings = $user->taxSettings ?? new EmployeeTaxSetting([
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
        ]);

        $taxTable = TaxTable::getActiveTableForDate($user->tenant_id);
        $availableReliefs = $taxTable?->reliefs()
            ->where('is_active', true)
            ->where('is_automatic', false)
            ->get() ?? collect();

        return [
            'taxSettings' => $taxSettings,
            'availableReliefs' => $availableReliefs,
            'taxSummary' => $this->taxCalculationService->getTaxSummaryForEmployee($user),
            'taxLawVersion' => $taxTable?->getTaxLawVersion()?->value,
            'taxLawLabel' => $taxTable?->getTaxLawVersion()?->shortLabel(),
        ];
    }

    public function updateSettings(User $user, array $validated): EmployeeTaxSetting
    {
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

        return $taxSettings;
    }

    public function uploadRentProof(User $user, UploadedFile $file, ?string $expiry): void
    {
        $taxSettings = $user->taxSettings;

        if (! $taxSettings) {
            $taxSettings = EmployeeTaxSetting::query()->create([
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
            ]);
        }

        if ($taxSettings->rent_proof_document) {
            Storage::disk('tenant')->delete($taxSettings->rent_proof_document);
        }

        $path = $file->store(
            "tenants/{$user->tenant_id}/tax-documents/{$user->id}",
            'tenant'
        );

        $taxSettings->updateRentProof(
            $path,
            $expiry ? Carbon::parse($expiry) : null
        );
    }

    public function deleteRentProof(User $user): void
    {
        $taxSettings = $user->taxSettings;

        if ($taxSettings && $taxSettings->rent_proof_document) {
            Storage::disk('tenant')->delete($taxSettings->rent_proof_document);
            $taxSettings->update([
                'rent_proof_document' => null,
                'rent_proof_expiry' => null,
            ]);
        }
    }

    public function previewTax(User $user, ?string $effectiveDate): array
    {
        $date = $effectiveDate ? Carbon::parse($effectiveDate) : null;

        return $this->taxCalculationService->getTaxSummaryForEmployee($user, $date);
    }

    public function compareTaxLaws(User $user): ?array
    {
        $payrollDetails = $user->employeePayrollDetail;

        if (! $payrollDetails) {
            return null;
        }

        $annualSalary = (float) $payrollDetails->basic_salary * 12;

        return $this->taxCalculationService->compareTaxLaws($annualSalary, $user->tenant_id);
    }
}
