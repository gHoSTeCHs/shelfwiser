<?php

namespace App\Models;

use App\Enums\EarningCalculationType;
use App\Enums\EarningCategory;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EarningType extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'description',
        'category',
        'calculation_type',
        'default_amount',
        'default_rate',
        'is_taxable',
        'is_pensionable',
        'is_recurring',
        'is_system',
        'is_active',
        'display_order',
        'metadata',
    ];

    protected $casts = [
        'category' => EarningCategory::class,
        'calculation_type' => EarningCalculationType::class,
        'default_amount' => 'decimal:2',
        'default_rate' => 'decimal:4',
        'is_taxable' => 'boolean',
        'is_pensionable' => 'boolean',
        'is_recurring' => 'boolean',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function employeeEarnings(): HasMany
    {
        return $this->hasMany(EmployeeEarning::class);
    }

    /**
     * Scope to filter active earning types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to filter system earning types
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to filter for a specific tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
