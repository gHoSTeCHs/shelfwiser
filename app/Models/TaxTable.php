<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class TaxTable extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'jurisdiction',
        'effective_year',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'effective_year' => 'integer',
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
}
