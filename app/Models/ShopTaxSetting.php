<?php

namespace App\Models;

use App\Enums\PayFrequency;
use App\Enums\TaxHandling;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopTaxSetting extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'shop_id',
        'tenant_id',
        'tax_jurisdiction_id',
        'enable_tax_calculations',
        'default_tax_handling',
        'overtime_threshold_hours',
        'overtime_multiplier',
        'default_payroll_frequency',
        'wage_advance_max_percentage',
        'default_pension_enabled',
        'default_nhf_enabled',
        'default_nhis_enabled',
    ];

    protected $casts = [
        'enable_tax_calculations' => 'boolean',
        'default_tax_handling' => TaxHandling::class,
        'overtime_threshold_hours' => 'decimal:2',
        'overtime_multiplier' => 'decimal:2',
        'default_payroll_frequency' => PayFrequency::class,
        'wage_advance_max_percentage' => 'decimal:2',
        'default_pension_enabled' => 'boolean',
        'default_nhf_enabled' => 'boolean',
        'default_nhis_enabled' => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function taxJurisdiction(): BelongsTo
    {
        return $this->belongsTo(TaxJurisdiction::class);
    }
}
