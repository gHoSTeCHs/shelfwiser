<?php

namespace App\Services;

use App\Models\TaxTable;
use App\Models\TaxRelief;
use App\Models\User;
use App\Models\EmployeeTaxSetting;
use Carbon\Carbon;

class TaxCalculationService
{
    public function calculateMonthlyPAYE(
        User $employee,
        float $monthlyGrossIncome,
        float $monthlyPreTaxDeductions = 0,
        array $activeReliefCodes = []
    ): array {
        $taxSettings = $employee->taxSettings;

        if ($taxSettings && $taxSettings->isCurrentlyExempt()) {
            return [
                'tax' => 0,
                'taxable_income' => 0,
                'reliefs_applied' => [],
                'band_breakdown' => [],
                'is_exempt' => true,
                'exemption_reason' => $taxSettings->exemption_reason,
            ];
        }

        $annualGross = $monthlyGrossIncome * 12;
        $annualPreTaxDeductions = $monthlyPreTaxDeductions * 12;

        $taxTable = TaxTable::getActiveTable($employee->tenant_id);

        if (!$taxTable) {
            return [
                'tax' => 0,
                'error' => 'No active tax table found',
            ];
        }

        $reliefsApplied = [];
        $totalReliefs = 0;

        $totalReliefs += $this->calculateCRA($annualGross);
        $reliefsApplied[] = [
            'code' => 'CRA',
            'name' => 'Consolidated Relief Allowance',
            'amount' => $this->calculateCRA($annualGross),
        ];

        $automaticReliefs = $taxTable->reliefs()
            ->where('is_automatic', true)
            ->where('is_active', true)
            ->where('code', '!=', 'CRA')
            ->get();

        foreach ($automaticReliefs as $relief) {
            $reliefAmount = $relief->calculateRelief($annualGross);
            $totalReliefs += $reliefAmount;
            $reliefsApplied[] = [
                'code' => $relief->code,
                'name' => $relief->name,
                'amount' => $reliefAmount,
            ];
        }

        if ($taxSettings && $taxSettings->active_reliefs) {
            $additionalReliefs = $taxTable->reliefs()
                ->whereIn('code', $taxSettings->active_reliefs)
                ->where('is_automatic', false)
                ->where('is_active', true)
                ->get();

            foreach ($additionalReliefs as $relief) {
                $reliefAmount = $relief->calculateRelief($annualGross);
                $totalReliefs += $reliefAmount;
                $reliefsApplied[] = [
                    'code' => $relief->code,
                    'name' => $relief->name,
                    'amount' => $reliefAmount,
                ];
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
        ];
    }

    /**
     * Calculate Consolidated Relief Allowance per Nigerian tax law.
     * CRA is the HIGHER of:
     * (a) 1% of gross income + N200,000 OR
     * (b) 20% of gross income
     */
    public function calculateCRA(float $grossIncome): float
    {
        $optionA = ($grossIncome * 0.01) + 200000;
        $optionB = $grossIncome * 0.20;

        return max($optionA, $optionB);
    }

    public function calculateAnnualTax(float $annualTaxableIncome, TaxTable $taxTable): float
    {
        $result = $taxTable->calculateAnnualTax($annualTaxableIncome);
        return $result['total_tax'];
    }

    public function getEffectiveTaxRate(float $grossIncome, float $taxAmount): float
    {
        if ($grossIncome <= 0) {
            return 0;
        }

        return round(($taxAmount / $grossIncome) * 100, 2);
    }

    public function getTaxSummaryForEmployee(User $employee): array
    {
        $payrollDetails = $employee->payrollDetails;

        if (!$payrollDetails) {
            return ['error' => 'Employee has no payroll details'];
        }

        $monthlyGross = (float) $payrollDetails->basic_salary;

        return $this->calculateMonthlyPAYE($employee, $monthlyGross);
    }

    public function estimateTaxForSalary(float $annualSalary, ?int $tenantId = null): array
    {
        $taxTable = TaxTable::getActiveTable($tenantId);

        if (!$taxTable) {
            return ['error' => 'No active tax table found'];
        }

        $cra = $this->calculateCRA($annualSalary);
        $taxableIncome = max(0, $annualSalary - $cra);
        $taxResult = $taxTable->calculateAnnualTax($taxableIncome);

        return [
            'gross_salary' => $annualSalary,
            'cra' => $cra,
            'taxable_income' => $taxableIncome,
            'annual_tax' => $taxResult['total_tax'],
            'monthly_tax' => round($taxResult['total_tax'] / 12, 2),
            'effective_rate' => $this->getEffectiveTaxRate($annualSalary, $taxResult['total_tax']),
            'band_breakdown' => $taxResult['breakdown'],
        ];
    }
}
