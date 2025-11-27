<?php

namespace App\Models;

use App\Enums\CompanySizeCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CorporateTaxRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'tax_jurisdiction_id',
        'turnover_from',
        'turnover_to',
        'tax_rate',
        'company_size_category',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'turnover_from' => 'decimal:2',
        'turnover_to' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'company_size_category' => CompanySizeCategory::class,
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function taxJurisdiction(): BelongsTo
    {
        return $this->belongsTo(TaxJurisdiction::class);
    }
}
