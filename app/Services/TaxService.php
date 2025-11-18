<?php

namespace App\Services;

use App\Enums\CompanySizeCategory;
use App\Models\CorporateTaxRate;
use App\Models\Shop;
use App\Models\TaxBracket;
use App\Models\TaxJurisdiction;
use App\Models\TaxRelief;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class TaxService
{
    /**
     * Calculate personal income tax (PAYE) for an employee
     *
     * @param  float  $grossIncome  The gross income for the period
     * @param  int|null  $taxJurisdictionId  The tax jurisdiction ID
     * @param  Carbon  $taxDate  The date for which to calculate tax (determines which tax law applies)
     * @param  array  $reliefs  Additional reliefs to apply (e.g., ['rent_paid' => 500000])
     * @return array Tax calculation breakdown including total tax, brackets applied, and reliefs
     */
    public function calculatePersonalIncomeTax(
        float $grossIncome,
        ?int $taxJurisdictionId,
        Carbon $taxDate,
        array $reliefs = []
    ): array {
        if (! $taxJurisdictionId || $grossIncome <= 0) {
            return [
                'gross_income' => $grossIncome,
                'total_reliefs' => 0,
                'taxable_income' => $grossIncome,
                'brackets_applied' => [],
                'total_tax' => 0,
                'effective_rate' => 0,
            ];
        }

        $taxBrackets = $this->getTaxBrackets($taxJurisdictionId, $taxDate);
        $taxReliefs = $this->getTaxReliefs($taxJurisdictionId, $taxDate);

        $totalReliefs = $this->calculateTotalReliefs($grossIncome, $taxReliefs, $reliefs);
        $taxableIncome = max(0, $grossIncome - $totalReliefs);

        $bracketsApplied = [];
        $totalTax = 0;

        if ($taxableIncome > 0) {
            foreach ($taxBrackets as $bracket) {
                if ($taxableIncome <= $bracket->income_from) {
                    break;
                }

                $bracketStart = $bracket->income_from;
                $bracketEnd = $bracket->income_to ?? PHP_FLOAT_MAX;

                $taxableInBracket = min($taxableIncome, $bracketEnd) - $bracketStart;

                if ($taxableInBracket > 0) {
                    $taxForBracket = $taxableInBracket * ($bracket->tax_rate / 100);
                    $totalTax += $taxForBracket;

                    $bracketsApplied[] = [
                        'bracket' => $bracket->bracket_order,
                        'rate' => $bracket->tax_rate,
                        'income_from' => $bracket->income_from,
                        'income_to' => $bracket->income_to,
                        'taxable_amount' => $taxableInBracket,
                        'tax_amount' => $taxForBracket,
                    ];
                }
            }
        }

        $effectiveRate = $grossIncome > 0 ? ($totalTax / $grossIncome) * 100 : 0;

        return [
            'gross_income' => $grossIncome,
            'reliefs_applied' => $totalReliefs,
            'taxable_income' => $taxableIncome,
            'brackets_applied' => $bracketsApplied,
            'total_tax' => round($totalTax, 2),
            'effective_rate' => round($effectiveRate, 2),
            'tax_date' => $taxDate->format('Y-m-d'),
        ];
    }

    /**
     * Calculate corporate income tax (CIT) for a shop/business
     *
     * @param  float  $annualTurnover  The total annual revenue
     * @param  float  $taxableProfit  The profit after deductions
     * @param  int|null  $taxJurisdictionId  The tax jurisdiction ID
     * @param  Carbon  $taxYear  The tax year
     * @return array Tax calculation breakdown
     */
    public function calculateCorporateTax(
        float $annualTurnover,
        float $taxableProfit,
        ?int $taxJurisdictionId,
        Carbon $taxYear
    ): array {
        if (! $taxJurisdictionId || $taxableProfit <= 0) {
            return [
                'annual_turnover' => $annualTurnover,
                'taxable_profit' => $taxableProfit,
                'company_size' => CompanySizeCategory::fromTurnover($annualTurnover)->value,
                'tax_rate' => 0,
                'tax_liability' => 0,
                'effective_rate' => 0,
            ];
        }

        $companySize = CompanySizeCategory::fromTurnover($annualTurnover);

        $taxRate = $this->getCorporateTaxRate($taxJurisdictionId, $annualTurnover, $taxYear);

        $taxLiability = $taxableProfit * ($taxRate / 100);

        $effectiveRate = $taxableProfit > 0 ? ($taxLiability / $taxableProfit) * 100 : 0;

        return [
            'annual_turnover' => $annualTurnover,
            'taxable_profit' => $taxableProfit,
            'company_size' => $companySize->value,
            'company_size_label' => $companySize->label(),
            'tax_rate' => $taxRate,
            'tax_liability' => round($taxLiability, 2),
            'effective_rate' => round($effectiveRate, 2),
            'tax_year' => $taxYear->year,
        ];
    }

    /**
     * Get tax brackets for a jurisdiction on a specific date
     */
    public function getTaxBrackets(int $jurisdictionId, Carbon $date): Collection
    {
        $cacheKey = "tax:brackets:{$jurisdictionId}:{$date->format('Y-m-d')}";

        return Cache::tags(['tax', "jurisdiction:{$jurisdictionId}"])
            ->remember($cacheKey, now()->addDay(), function () use ($jurisdictionId, $date) {
                return TaxBracket::where('tax_jurisdiction_id', $jurisdictionId)
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
     * Get tax reliefs for a jurisdiction on a specific date
     */
    public function getTaxReliefs(int $jurisdictionId, Carbon $date): Collection
    {
        $cacheKey = "tax:reliefs:{$jurisdictionId}:{$date->format('Y-m-d')}";

        return Cache::tags(['tax', "jurisdiction:{$jurisdictionId}"])
            ->remember($cacheKey, now()->addDay(), function () use ($jurisdictionId, $date) {
                return TaxRelief::where('tax_jurisdiction_id', $jurisdictionId)
                    ->where('effective_from', '<=', $date)
                    ->where(function ($q) use ($date) {
                        $q->whereNull('effective_to')
                            ->orWhere('effective_to', '>=', $date);
                    })
                    ->get();
            });
    }

    /**
     * Get corporate tax rate for a jurisdiction based on turnover
     *
     * @return float The tax rate percentage
     */
    public function getCorporateTaxRate(int $jurisdictionId, float $annualTurnover, Carbon $taxYear): float
    {
        $cacheKey = "tax:corporate:{$jurisdictionId}:{$taxYear->year}";

        $rates = Cache::tags(['tax', "jurisdiction:{$jurisdictionId}"])
            ->remember($cacheKey, now()->addDay(), function () use ($jurisdictionId, $taxYear) {
                return CorporateTaxRate::where('tax_jurisdiction_id', $jurisdictionId)
                    ->where('effective_from', '<=', $taxYear)
                    ->where(function ($q) use ($taxYear) {
                        $q->whereNull('effective_to')
                            ->orWhere('effective_to', '>=', $taxYear);
                    })
                    ->orderBy('turnover_from')
                    ->get();
            });

        foreach ($rates as $rate) {
            $meetsMinimum = $annualTurnover >= $rate->turnover_from;
            $meetsMaximum = is_null($rate->turnover_to) || $annualTurnover <= $rate->turnover_to;

            if ($meetsMinimum && $meetsMaximum) {
                return $rate->tax_rate;
            }
        }

        return 0;
    }

    /**
     * Calculate total tax reliefs to apply
     */
    protected function calculateTotalReliefs(float $grossIncome, Collection $taxReliefs, array $additionalReliefs): float
    {
        $totalReliefs = 0;

        foreach ($taxReliefs as $relief) {
            $reliefAmount = match ($relief->calculation_method) {
                'fixed' => $relief->amount,
                'percentage' => $grossIncome * ($relief->percentage / 100),
                'higher_of' => max(
                    $relief->amount ?? 0,
                    $grossIncome * ($relief->percentage / 100)
                ),
                'cra' => $this->calculateCRA($grossIncome, $relief),
                'rent_relief' => $this->calculateRentRelief($additionalReliefs['rent_paid'] ?? 0, $relief),
                default => 0,
            };

            if ($relief->cap_amount && $reliefAmount > $relief->cap_amount) {
                $reliefAmount = $relief->cap_amount;
            }

            $totalReliefs += $reliefAmount;
        }

        return $totalReliefs;
    }

    /**
     * Calculate Consolidated Relief Allowance (Nigerian tax law pre-2026)
     */
    protected function calculateCRA(float $grossIncome, TaxRelief $relief): float
    {
        $baseCRA = max(200000, $grossIncome * 0.01);
        $additionalCRA = $grossIncome * 0.20;

        return $baseCRA + $additionalCRA;
    }

    /**
     * Calculate Rent Relief (Nigerian tax law from 2026)
     */
    protected function calculateRentRelief(float $annualRentPaid, TaxRelief $relief): float
    {
        $reliefAmount = $annualRentPaid * 0.20;

        return min($reliefAmount, $relief->cap_amount ?? 500000);
    }

    /**
     * Get tax jurisdiction for a shop
     */
    public function getShopTaxJurisdiction(Shop $shop): ?TaxJurisdiction
    {
        $taxSettings = $shop->taxSettings;

        if (! $taxSettings || ! $taxSettings->tax_jurisdiction_id) {
            return null;
        }

        return TaxJurisdiction::find($taxSettings->tax_jurisdiction_id);
    }

    /**
     * Calculate taxable income after applying all reliefs
     */
    public function calculateTaxableIncome(
        float $grossIncome,
        array $reliefs,
        int $jurisdictionId,
        Carbon $date
    ): float {
        $taxReliefs = $this->getTaxReliefs($jurisdictionId, $date);
        $totalReliefs = $this->calculateTotalReliefs($grossIncome, $taxReliefs, $reliefs);

        return max(0, $grossIncome - $totalReliefs);
    }
}
