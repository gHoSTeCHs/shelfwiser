<?php

namespace App\Services;

use App\Enums\PayType;
use App\Enums\TaxLawVersion;
use App\Models\EmployeeTaxSetting;
use App\Models\TaxTable;
use App\Models\User;
use Carbon\Carbon;

class TaxCalculationService
{
    /**
     * Calculate monthly PAYE tax with date-aware tax law selection.
     *
     * @param  User  $employee  The employee to calculate tax for
     * @param  float  $monthlyGrossIncome  Monthly gross income
     * @param  float  $monthlyPreTaxDeductions  Monthly pre-tax deductions (pension, etc.)
     * @param  array  $activeReliefCodes  Optional relief codes to apply
     * @param  Carbon|null  $effectiveDate  Date to determine which tax law applies (defaults to now)
     */
    public function calculateMonthlyPAYE(
        User $employee,
        float $monthlyGrossIncome,
        float $monthlyPreTaxDeductions = 0,
        array $activeReliefCodes = [],
        ?Carbon $effectiveDate = null
    ): array {
        $effectiveDate = $effectiveDate ?? now();
        $taxSettings = $employee->taxSettings;

        if ($taxSettings && $taxSettings->isCurrentlyExempt()) {
            return [
                'tax' => 0,
                'taxable_income' => 0,
                'reliefs_applied' => [],
                'band_breakdown' => [],
                'is_exempt' => true,
                'exemption_reason' => $taxSettings->exemption_reason,
                'tax_law_version' => null,
            ];
        }

        $annualGross = $this->annualizeIncome($employee, $monthlyGrossIncome);
        $annualPreTaxDeductions = $this->annualizeIncome($employee, $monthlyPreTaxDeductions);

        $taxTable = $this->getApplicableTaxTable($employee->tenant_id, $effectiveDate);

        if (! $taxTable) {
            return [
                'tax' => 0,
                'error' => 'No active tax table found',
                'tax_law_version' => null,
            ];
        }

        $taxLawVersion = $taxTable->getTaxLawVersion();

        if ($taxTable->isLowIncomeExempt($annualGross)) {
            return [
                'tax' => 0,
                'annual_tax' => 0,
                'taxable_income' => 0,
                'annual_taxable_income' => 0,
                'total_reliefs' => $annualGross,
                'reliefs_applied' => [
                    [
                        'code' => 'LOW_INCOME_EXEMPTION',
                        'name' => 'Low Income Exemption',
                        'amount' => $annualGross,
                    ],
                ],
                'band_breakdown' => [],
                'is_exempt' => true,
                'is_low_income_exempt' => true,
                'exemption_reason' => 'Annual income below ₦'.number_format($taxTable->low_income_threshold ?? 800000),
                'tax_law_version' => $taxLawVersion?->value,
            ];
        }

        $reliefsApplied = [];
        $totalReliefs = 0;

        if ($taxTable->hasCRA()) {
            $craAmount = $this->calculateCRA($annualGross, $taxLawVersion);
            $totalReliefs += $craAmount;
            $reliefsApplied[] = [
                'code' => 'CRA',
                'name' => 'Consolidated Relief Allowance',
                'amount' => $craAmount,
            ];
        }

        if ($taxLawVersion === TaxLawVersion::NTA_2025 && $taxSettings && $taxSettings->canClaimRentRelief()) {
            $rentRelief = $this->calculateRentRelief($taxSettings, $taxTable);
            if ($rentRelief > 0) {
                $totalReliefs += $rentRelief;
                $reliefsApplied[] = [
                    'code' => 'RENT_RELIEF',
                    'name' => 'Rent Relief',
                    'amount' => $rentRelief,
                    'requires_proof' => true,
                    'proof_status' => $taxSettings->hasValidRentProof() ? 'valid' : 'missing',
                ];
            }
        }

        $automaticReliefs = $taxTable->reliefs()
            ->where('is_automatic', true)
            ->where('is_active', true)
            ->whereNotIn('code', ['CRA', 'LOW_INCOME_EXEMPTION', 'RENT_RELIEF'])
            ->get();

        $reliefContext = [
            'annual_rent_paid' => $taxSettings?->annual_rent_paid ?? 0,
        ];

        foreach ($automaticReliefs as $relief) {
            $reliefAmount = $relief->calculateRelief($annualGross, $reliefContext);
            if ($reliefAmount > 0) {
                $totalReliefs += $reliefAmount;
                $reliefsApplied[] = [
                    'code' => $relief->code,
                    'name' => $relief->name,
                    'amount' => $reliefAmount,
                ];
            }
        }

        if ($taxSettings && $taxSettings->active_reliefs) {
            $additionalReliefs = $taxTable->reliefs()
                ->whereIn('code', $taxSettings->active_reliefs)
                ->where('is_automatic', false)
                ->where('is_active', true)
                ->get();

            foreach ($additionalReliefs as $relief) {
                if ($relief->isEligible($taxSettings->getEligibilitySettings())) {
                    $reliefAmount = $relief->calculateRelief($annualGross, $reliefContext);
                    if ($reliefAmount > 0) {
                        $totalReliefs += $reliefAmount;
                        $reliefsApplied[] = [
                            'code' => $relief->code,
                            'name' => $relief->name,
                            'amount' => $reliefAmount,
                            'requires_proof' => $relief->requires_proof,
                        ];
                    }
                }
            }
        }

        $annualTaxableIncome = max(0, $annualGross - $annualPreTaxDeductions - $totalReliefs);

        $taxResult = $taxTable->calculateAnnualTax($annualTaxableIncome);
        $annualTax = $taxResult['total_tax'];
        $bandBreakdown = $taxResult['breakdown'];

        $monthlyTax = round($annualTax / 12, 2);

        return [
            'tax' => $monthlyTax,
            'annual_tax' => $annualTax,
            'taxable_income' => round($annualTaxableIncome / 12, 2),
            'annual_taxable_income' => $annualTaxableIncome,
            'total_reliefs' => $totalReliefs,
            'reliefs_applied' => $reliefsApplied,
            'band_breakdown' => $bandBreakdown,
            'is_exempt' => false,
            'is_low_income_exempt' => false,
            'tax_law_version' => $taxLawVersion?->value,
            'effective_date' => $effectiveDate->format('Y-m-d'),
        ];
    }

    /**
     * Annualize income based on employee pay type.
     * For hourly and daily workers, uses expected annual hours instead of simple monthly multiplication.
     *
     * @param  User  $employee  The employee
     * @param  float  $monthlyAmount  The monthly amount to annualize
     * @return float Annual amount
     */
    protected function annualizeIncome(User $employee, float $monthlyAmount): float
    {
        $payrollDetail = $employee->employeePayrollDetail;

        if (! $payrollDetail) {
            return $monthlyAmount * 12;
        }

        if ($payrollDetail->pay_type === PayType::HOURLY || $payrollDetail->pay_type === PayType::DAILY) {
            $standardHoursPerWeek = $payrollDetail->standard_hours_per_week ?? 40;
            $expectedAnnualHours = $standardHoursPerWeek * 52;
            $monthlyHours = $standardHoursPerWeek * 4.33;

            if ($monthlyHours > 0) {
                $annualizationFactor = $expectedAnnualHours / $monthlyHours;

                return $monthlyAmount * $annualizationFactor;
            }
        }

        return $monthlyAmount * 12;
    }

    /**
     * Get the applicable tax table for a specific date.
     */
    protected function getApplicableTaxTable(int $tenantId, Carbon $date): ?TaxTable
    {
        return TaxTable::getActiveTableForDate($tenantId, $date);
    }

    /**
     * Calculate Consolidated Relief Allowance with tax law version guard.
     * CRA calculation differs between PITA 2011 and NTA 2025.
     *
     * @param  float  $grossIncome  Annual gross income
     * @param  TaxLawVersion|null  $taxLawVersion  The tax law version to use
     */
    public function calculateCRA(float $grossIncome, ?TaxLawVersion $taxLawVersion = null): float
    {
        if ($taxLawVersion === TaxLawVersion::NTA_2025) {
            return $this->calculateNTA2025CRA($grossIncome);
        }

        return $this->calculatePITA2011CRA($grossIncome);
    }

    /**
     * Calculate CRA under PITA 2011.
     * CRA is the HIGHER of:
     * (a) 1% of gross income + ₦200,000 OR
     * (b) 20% of gross income
     */
    protected function calculatePITA2011CRA(float $grossIncome): float
    {
        $optionA = ($grossIncome * 0.01) + 200000;
        $optionB = $grossIncome * 0.20;

        return max($optionA, $optionB);
    }

    /**
     * Calculate CRA under NTA 2025.
     * NTA 2025 may have different CRA rules or no CRA at all.
     * Currently returns 0 as NTA 2025 does not have CRA (uses Rent Relief instead).
     */
    protected function calculateNTA2025CRA(float $grossIncome): float
    {
        return 0;
    }

    /**
     * Calculate Rent Relief (NTA 2025).
     * Dynamically retrieves rent relief configuration from the TaxRelief table.
     * No hardcoded defaults - returns 0 if relief configuration is not found.
     */
    protected function calculateRentRelief(EmployeeTaxSetting $taxSettings, TaxTable $taxTable): float
    {
        if (! $taxSettings->canClaimRentRelief()) {
            return 0;
        }

        $rentRelief = $taxTable->reliefs()
            ->where('code', 'RENT_RELIEF')
            ->where('is_active', true)
            ->first();

        if ($rentRelief) {
            return $rentRelief->calculateRentRelief($taxSettings->annual_rent_paid ?? 0);
        }

        return 0;
    }

    /**
     * Calculate annual tax using a specific tax table.
     */
    public function calculateAnnualTax(float $annualTaxableIncome, TaxTable $taxTable): float
    {
        $result = $taxTable->calculateAnnualTax($annualTaxableIncome);

        return $result['total_tax'];
    }

    /**
     * Get effective tax rate as a percentage.
     */
    public function getEffectiveTaxRate(float $grossIncome, float $taxAmount): float
    {
        if ($grossIncome <= 0) {
            return 0;
        }

        return round(($taxAmount / $grossIncome) * 100, 2);
    }

    /**
     * Get tax summary for an employee.
     */
    public function getTaxSummaryForEmployee(User $employee, ?Carbon $effectiveDate = null): array
    {
        $payrollDetails = $employee->employeePayrollDetail;

        if (! $payrollDetails) {
            return ['error' => 'Employee has no payroll details'];
        }

        $monthlyGross = (float) $payrollDetails->basic_salary;

        return $this->calculateMonthlyPAYE($employee, $monthlyGross, 0, [], $effectiveDate);
    }

    /**
     * Estimate tax for a given salary amount.
     */
    public function estimateTaxForSalary(
        float $annualSalary,
        ?int $tenantId = null,
        ?Carbon $effectiveDate = null
    ): array {
        $effectiveDate = $effectiveDate ?? now();
        $taxTable = $this->getApplicableTaxTable($tenantId ?? 0, $effectiveDate);

        if (! $taxTable) {
            return ['error' => 'No active tax table found'];
        }

        $taxLawVersion = $taxTable->getTaxLawVersion();
        $totalReliefs = 0;
        $reliefsApplied = [];

        if ($taxTable->isLowIncomeExempt($annualSalary)) {
            return [
                'gross_salary' => $annualSalary,
                'total_reliefs' => $annualSalary,
                'taxable_income' => 0,
                'annual_tax' => 0,
                'monthly_tax' => 0,
                'effective_rate' => 0,
                'is_low_income_exempt' => true,
                'tax_law_version' => $taxLawVersion?->value,
                'band_breakdown' => [],
            ];
        }

        if ($taxTable->hasCRA()) {
            $cra = $this->calculateCRA($annualSalary, $taxLawVersion);
            $totalReliefs += $cra;
            $reliefsApplied[] = ['code' => 'CRA', 'name' => 'CRA', 'amount' => $cra];
        }

        $taxableIncome = max(0, $annualSalary - $totalReliefs);
        $taxResult = $taxTable->calculateAnnualTax($taxableIncome);

        return [
            'gross_salary' => $annualSalary,
            'total_reliefs' => $totalReliefs,
            'reliefs_applied' => $reliefsApplied,
            'taxable_income' => $taxableIncome,
            'annual_tax' => $taxResult['total_tax'],
            'monthly_tax' => round($taxResult['total_tax'] / 12, 2),
            'effective_rate' => $this->getEffectiveTaxRate($annualSalary, $taxResult['total_tax']),
            'is_low_income_exempt' => false,
            'tax_law_version' => $taxLawVersion?->value,
            'band_breakdown' => $taxResult['breakdown'],
        ];
    }

    /**
     * Compare tax under different tax law versions.
     */
    public function compareTaxLaws(float $annualSalary, ?int $tenantId = null): array
    {
        $pita2011Date = Carbon::parse('2025-12-31');
        $nta2025Date = Carbon::parse('2026-01-01');

        return [
            'pita_2011' => $this->estimateTaxForSalary($annualSalary, $tenantId, $pita2011Date),
            'nta_2025' => $this->estimateTaxForSalary($annualSalary, $tenantId, $nta2025Date),
        ];
    }

    /**
     * Get tax brackets for a jurisdiction on a specific date.
     * Migrated from TaxService for unified tax data access.
     */
    public function getTaxBrackets(int $jurisdictionId, Carbon $date): \Illuminate\Support\Collection
    {
        $cacheKey = "tax:brackets:{$jurisdictionId}:{$date->format('Y-m-d')}";

        return \Illuminate\Support\Facades\Cache::tags(['tax', "jurisdiction:{$jurisdictionId}"])
            ->remember($cacheKey, now()->addDay(), function () use ($jurisdictionId, $date) {
                return \App\Models\TaxBracket::where('tax_jurisdiction_id', $jurisdictionId)
                    ->where('effective_from', '<=', $date)
                    ->where(function ($q) use ($date) {
                        $q->whereNull('effective_to')
                            ->orWhere('effective_to', '>=', $date);
                    })
                    ->orderBy('bracket_order')
                    ->get();
            });
    }

    /**
     * Get tax reliefs for a jurisdiction on a specific date.
     * Migrated from TaxService for unified tax data access.
     */
    public function getTaxReliefs(int $jurisdictionId, Carbon $date): \Illuminate\Support\Collection
    {
        $cacheKey = "tax:reliefs:{$jurisdictionId}:{$date->format('Y-m-d')}";

        return \Illuminate\Support\Facades\Cache::tags(['tax', "jurisdiction:{$jurisdictionId}"])
            ->remember($cacheKey, now()->addDay(), function () use ($jurisdictionId, $date) {
                return \App\Models\TaxRelief::where('tax_jurisdiction_id', $jurisdictionId)
                    ->where('effective_from', '<=', $date)
                    ->where(function ($q) use ($date) {
                        $q->whereNull('effective_to')
                            ->orWhere('effective_to', '>=', $date);
                    })
                    ->get();
            });
    }
}
