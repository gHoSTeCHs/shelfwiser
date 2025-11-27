<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxRelief extends Model
{
    use HasFactory;

    protected $fillable = [
        'tax_jurisdiction_id',
        'relief_type',
        'calculation_method',
        'amount',
        'percentage',
        'cap_amount',
        'formula',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percentage' => 'decimal:2',
        'cap_amount' => 'decimal:2',
        'formula' => 'array',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function taxJurisdiction(): BelongsTo
    {
        return $this->belongsTo(TaxJurisdiction::class);
    }
}
