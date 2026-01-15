<?php

namespace App\Models;

use App\Enums\TaxReliefType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxRelief extends Model
{
    use HasFactory;

    protected $fillable = [
        'tax_table_id',
        'code',
        'name',
        'description',
        'relief_type',
        'amount',
        'rate',
        'cap',
        'is_automatic',
        'is_active',
        'requires_proof',
        'proof_type',
        'eligibility_criteria',
        'calculation_formula',
    ];

    protected $casts = [
        'relief_type' => TaxReliefType::class,
        'amount' => 'decimal:2',
        'rate' => 'decimal:4',
        'cap' => 'decimal:2',
        'is_automatic' => 'boolean',
        'is_active' => 'boolean',
        'requires_proof' => 'boolean',
        'eligibility_criteria' => 'array',
    ];

    public function taxTable(): BelongsTo
    {
        return $this->belongsTo(TaxTable::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAutomatic(Builder $query): Builder
    {
        return $query->where('is_automatic', true);
    }

    public function scopeManual(Builder $query): Builder
    {
        return $query->where('is_automatic', false);
    }

    public function scopeByCode(Builder $query, string $code): Builder
    {
        return $query->where('code', $code);
    }

    /**
     * Calculate relief amount based on relief type and context.
     *
     * @param  float  $grossIncome  Annual gross income
     * @param  array  $context  Additional context like ['annual_rent_paid' => 500000]
     */
    public function calculateRelief(float $grossIncome, array $context = []): float
    {
        if (! $this->is_active) {
            return 0;
        }

        $reliefType = $this->relief_type instanceof TaxReliefType
            ? $this->relief_type
            : TaxReliefType::tryFrom($this->relief_type);

        return match ($reliefType) {
            TaxReliefType::FIXED => (float) ($this->amount ?? 0),
            TaxReliefType::PERCENTAGE => $grossIncome * (($this->rate ?? 0) / 100),
            TaxReliefType::CAPPED_PERCENTAGE => min(
                $grossIncome * (($this->rate ?? 0) / 100),
                (float) ($this->cap ?? PHP_FLOAT_MAX)
            ),
            TaxReliefType::CRA => $this->calculateCRA($grossIncome),
            TaxReliefType::RENT_RELIEF => $this->calculateRentRelief($context['annual_rent_paid'] ?? 0),
            TaxReliefType::LOW_INCOME_EXEMPTION => $this->calculateLowIncomeExemption($grossIncome),
            default => 0,
        };
    }

    /**
     * Calculate Consolidated Relief Allowance with tax law version guard.
     * CRA is only applicable under PITA 2011.
     * Under NTA 2025, CRA does not exist (Rent Relief is used instead).
     *
     * For PITA 2011, CRA is the HIGHER of:
     * (a) 1% of gross income + ₦200,000 OR
     * (b) 20% of gross income
     */
    public function calculateCRA(float $grossIncome): float
    {
        $taxLawVersion = $this->taxTable?->getTaxLawVersion();

        if ($taxLawVersion === \App\Enums\TaxLawVersion::NTA_2025) {
            return 0;
        }

        $optionA = ($grossIncome * 0.01) + 200000;
        $optionB = $grossIncome * 0.20;

        return max($optionA, $optionB);
    }

    /**
     * Calculate Rent Relief (NTA 2025).
     * Relief is: min(₦500,000, 20% of annual rent paid)
     */
    public function calculateRentRelief(float $annualRentPaid): float
    {
        if ($annualRentPaid <= 0) {
            return 0;
        }

        $rate = ($this->rate ?? 20) / 100;
        $cap = (float) ($this->cap ?? 500000);

        return min($annualRentPaid * $rate, $cap);
    }

    /**
     * Calculate Low Income Exemption (NTA 2025).
     * Full exemption if annual income ≤ ₦800,000 - returns the gross income as relief.
     */
    public function calculateLowIncomeExemption(float $annualGrossIncome): float
    {
        $threshold = (float) ($this->amount ?? 800000);

        if ($annualGrossIncome <= $threshold) {
            return $annualGrossIncome;
        }

        return 0;
    }

    /**
     * Check if employee meets eligibility criteria for this relief.
     *
     * @param  array  $employeeSettings  Employee's tax settings (is_homeowner, has_valid_proof, etc.)
     */
    public function isEligible(array $employeeSettings = []): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if (empty($this->eligibility_criteria)) {
            return true;
        }

        foreach ($this->eligibility_criteria as $key => $requiredValue) {
            $employeeValue = $employeeSettings[$key] ?? null;

            if ($employeeValue !== $requiredValue) {
                return false;
            }
        }

        if ($this->requires_proof && ! ($employeeSettings['has_valid_proof'] ?? false)) {
            return false;
        }

        return true;
    }

    /**
     * Check if this relief requires proof documentation.
     */
    public function requiresProof(): bool
    {
        return (bool) $this->requires_proof;
    }

    public function getReliefDescriptionAttribute(): string
    {
        $reliefType = $this->relief_type instanceof TaxReliefType
            ? $this->relief_type
            : TaxReliefType::tryFrom($this->relief_type);

        return match ($reliefType) {
            TaxReliefType::FIXED => '₦'.number_format($this->amount ?? 0, 0),
            TaxReliefType::PERCENTAGE => "{$this->rate}% of gross income",
            TaxReliefType::CAPPED_PERCENTAGE => "{$this->rate}% (max ₦".number_format($this->cap ?? 0, 0).')',
            TaxReliefType::CRA => 'max((1% of gross + ₦200K), 20% of gross)',
            TaxReliefType::RENT_RELIEF => 'min(₦'.number_format($this->cap ?? 500000, 0).", {$this->rate}% of rent)",
            TaxReliefType::LOW_INCOME_EXEMPTION => 'Full exemption if income ≤₦'.number_format($this->amount ?? 800000, 0),
            default => 'Unknown',
        };
    }
}
