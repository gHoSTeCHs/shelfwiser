<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxBand extends Model
{
    use HasFactory;

    protected $fillable = [
        'tax_table_id',
        'min_amount',
        'max_amount',
        'rate',
        'cumulative_tax',
        'band_order',
    ];

    protected $casts = [
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'rate' => 'decimal:2',
        'cumulative_tax' => 'decimal:2',
        'band_order' => 'integer',
    ];

    public function taxTable(): BelongsTo
    {
        return $this->belongsTo(TaxTable::class);
    }

    public function calculateTaxForBand(float $taxableIncome): float
    {
        if ($taxableIncome <= $this->min_amount) {
            return 0;
        }

        $maxAmount = $this->max_amount ?? PHP_FLOAT_MAX;
        $taxableInBand = min($taxableIncome, $maxAmount) - $this->min_amount;

        return max(0, $taxableInBand) * ($this->rate / 100);
    }

    public function getBandRangeAttribute(): string
    {
        $min = number_format($this->min_amount, 0);
        $max = $this->max_amount ? number_format($this->max_amount, 0) : 'Above';

        return $this->max_amount
            ? "₦{$min} - ₦{$max}"
            : "₦{$min} and above";
    }

    public function getRateLabelAttribute(): string
    {
        return "{$this->rate}%";
    }
}
