<?php

namespace App\Models;

use App\Enums\TaxReliefType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

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
    ];

    protected $casts = [
        'relief_type' => TaxReliefType::class,
        'amount' => 'decimal:2',
        'rate' => 'decimal:4',
        'cap' => 'decimal:2',
        'is_automatic' => 'boolean',
        'is_active' => 'boolean',
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

    public function calculateRelief(float $grossIncome): float
    {
        if (!$this->is_active) {
            return 0;
        }

        $reliefType = $this->relief_type instanceof TaxReliefType
            ? $this->relief_type
            : TaxReliefType::tryFrom($this->relief_type);

        return match($reliefType) {
            TaxReliefType::FIXED => (float) ($this->amount ?? 0),
            TaxReliefType::PERCENTAGE => $grossIncome * (($this->rate ?? 0) / 100),
            TaxReliefType::CAPPED_PERCENTAGE => min(
                $grossIncome * (($this->rate ?? 0) / 100),
                (float) ($this->cap ?? PHP_FLOAT_MAX)
            ),
            default => 0,
        };
    }

    public function calculateCRA(float $grossIncome): float
    {
        $percentageRelief = $grossIncome * 0.20;
        $minimumRelief = max(200000, $grossIncome * 0.01);

        return $minimumRelief + $percentageRelief;
    }

    public function getReliefDescriptionAttribute(): string
    {
        $reliefType = $this->relief_type instanceof TaxReliefType
            ? $this->relief_type
            : TaxReliefType::tryFrom($this->relief_type);

        return match($reliefType) {
            TaxReliefType::FIXED => "₦" . number_format($this->amount ?? 0, 0),
            TaxReliefType::PERCENTAGE => "{$this->rate}% of gross income",
            TaxReliefType::CAPPED_PERCENTAGE => "{$this->rate}% (max ₦" . number_format($this->cap ?? 0, 0) . ")",
            default => 'Unknown',
        };
    }
}
