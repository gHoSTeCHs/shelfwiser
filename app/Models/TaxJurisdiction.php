<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaxJurisdiction extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'country_code',
        'state_province',
        'city',
        'effective_from',
        'effective_to',
        'is_active',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
        'is_active' => 'boolean',
    ];

    public function taxBrackets(): HasMany
    {
        return $this->hasMany(TaxBracket::class);
    }

    public function corporateTaxRates(): HasMany
    {
        return $this->hasMany(CorporateTaxRate::class);
    }

    public function taxReliefs(): HasMany
    {
        return $this->hasMany(TaxRelief::class);
    }

    public function shopTaxSettings(): HasMany
    {
        return $this->hasMany(ShopTaxSetting::class);
    }
}
