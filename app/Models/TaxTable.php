<?php

namespace App\Models;

use App\Enums\TaxLawVersion;
use App\Traits\BelongsToTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxTable extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'jurisdiction',
        'effective_year',
        'effective_from',
        'effective_to',
        'tax_law_reference',
        'has_low_income_exemption',
        'low_income_threshold',
        'cra_applicable',
        'minimum_tax_rate',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'effective_year' => 'integer',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'has_low_income_exemption' => 'boolean',
        'low_income_threshold' => 'decimal:2',
        'cra_applicable' => 'boolean',
        'minimum_tax_rate' => 'decimal:2',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function bands(): HasMany
    {
        return $this->hasMany(TaxBand::class)->orderBy('band_order');
    }

    public function reliefs(): HasMany
    {
        return $this->hasMany(TaxRelief::class);
    }

    public function activeReliefs(): HasMany
    {
        return $this->reliefs()->where('is_active', true);
    }

    public function automaticReliefs(): HasMany
    {
        return $this->reliefs()
            ->where('is_active', true)
            ->where('is_automatic', true);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system', true);
    }

    public function scopeForJurisdiction(Builder $query, string $jurisdiction): Builder
    {
        return $query->where('jurisdiction', $jurisdiction);
    }

    public function scopeForYear(Builder $query, int $year): Builder
    {
        return $query->where('effective_year', '<=', $year)
            ->orderBy('effective_year', 'desc');
    }

    public function scopeForTenant(Builder $query, ?int $tenantId): Builder
    {
        return $query->where(function ($q) use ($tenantId) {
            $q->where('is_system', true);
            if ($tenantId) {
                $q->orWhere('tenant_id', $tenantId);
            }
        });
    }

    public static function getActiveTable(?int $tenantId = null, ?int $year = null, string $jurisdiction = 'NG'): ?self
    {
        $year = $year ?? now()->year;

        return self::with(['bands', 'reliefs'])
            ->active()
            ->forJurisdiction($jurisdiction)
            ->forYear($year)
            ->forTenant($tenantId)
            ->first();
    }

    public function calculateAnnualTax(float $taxableIncome): array
    {
        $totalTax = 0;
        $breakdown = [];

        foreach ($this->bands as $band) {
            $taxInBand = $band->calculateTaxForBand($taxableIncome);

            if ($taxInBand > 0) {
                $breakdown[] = [
                    'band_order' => $band->band_order,
                    'min_amount' => $band->min_amount,
                    'max_amount' => $band->max_amount,
                    'rate' => $band->rate,
                    'tax_amount' => $taxInBand,
                ];
                $totalTax += $taxInBand;
            }
        }

        return [
            'total_tax' => round($totalTax, 2),
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Get the active tax table for a specific date (determines PITA 2011 vs NTA 2025).
     */
    public static function getActiveTableForDate(
        ?int $tenantId = null,
        ?Carbon $date = null,
        string $jurisdiction = 'NG'
    ): ?self {
        $date = $date ?? now();

        return self::with(['bands', 'reliefs'])
            ->active()
            ->forJurisdiction($jurisdiction)
            ->forTenant($tenantId)
            ->where(function ($query) use ($date) {
                $query->where('effective_from', '<=', $date)
                    ->where(function ($q) use ($date) {
                        $q->whereNull('effective_to')
                            ->orWhere('effective_to', '>=', $date);
                    });
            })
            ->orderByDesc('effective_from')
            ->first();
    }

    /**
     * Check if income qualifies for low-income exemption under this tax table.
     */
    public function isLowIncomeExempt(float $annualIncome): bool
    {
        if (! $this->has_low_income_exemption) {
            return false;
        }

        return $annualIncome <= ($this->low_income_threshold ?? 0);
    }

    /**
     * Check if CRA (Consolidated Relief Allowance) applies to this tax table.
     */
    public function hasCRA(): bool
    {
        return (bool) ($this->cra_applicable ?? true);
    }

    /**
     * Get the TaxLawVersion enum for this table.
     */
    public function getTaxLawVersion(): ?TaxLawVersion
    {
        if (! $this->tax_law_reference) {
            return null;
        }

        return TaxLawVersion::tryFrom($this->tax_law_reference);
    }

    /**
     * Scope to filter by effective date range.
     */
    public function scopeEffectiveOn(Builder $query, Carbon $date): Builder
    {
        return $query->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date);
            });
    }
}
