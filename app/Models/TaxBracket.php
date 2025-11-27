<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxBracket extends Model
{
    use HasFactory;

    protected $fillable = [
        'tax_jurisdiction_id',
        'income_from',
        'income_to',
        'tax_rate',
        'bracket_order',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'income_from' => 'decimal:2',
        'income_to' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'bracket_order' => 'integer',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function taxJurisdiction(): BelongsTo
    {
        return $this->belongsTo(TaxJurisdiction::class);
    }
}
