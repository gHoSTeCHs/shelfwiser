<?php

namespace App\Models;

use App\Enums\DeductionCalculationBase;
use App\Enums\DeductionCalculationType;
use App\Enums\DeductionCategory;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeductionTypeModel extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $table = 'deduction_types';

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'description',
        'category',
        'calculation_type',
        'calculation_base',
        'default_amount',
        'default_rate',
        'max_amount',
        'annual_cap',
        'is_pre_tax',
        'is_mandatory',
        'is_system',
        'is_active',
        'priority',
        'metadata',
    ];

    protected $casts = [
        'category' => DeductionCategory::class,
        'calculation_type' => DeductionCalculationType::class,
        'calculation_base' => DeductionCalculationBase::class,
        'default_amount' => 'decimal:2',
        'default_rate' => 'decimal:4',
        'max_amount' => 'decimal:2',
        'annual_cap' => 'decimal:2',
        'is_pre_tax' => 'boolean',
        'is_mandatory' => 'boolean',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function employeeDeductions(): HasMany
    {
        return $this->hasMany(EmployeeDeduction::class, 'deduction_type_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, DeductionCategory $category)
    {
        return $query->where('category', $category->value);
    }

    public function scopeStatutory($query)
    {
        return $query->where('category', DeductionCategory::STATUTORY->value);
    }

    public function scopeVoluntary($query)
    {
        return $query->where('category', DeductionCategory::VOLUNTARY->value);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeOrderedByPriority($query)
    {
        return $query->orderBy('priority', 'asc');
    }

    public function isStatutory(): bool
    {
        return $this->category === DeductionCategory::STATUTORY;
    }

    public function isLoanType(): bool
    {
        return in_array($this->category, [DeductionCategory::LOAN, DeductionCategory::ADVANCE]);
    }
}
