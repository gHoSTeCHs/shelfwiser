<?php

namespace App\Models;

use App\Enums\EmploymentType;
use App\Enums\PayFrequency;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'is_system',
        'role',
        'employment_type',
        'position_title',
        'department',
        'pay_type',
        'pay_amount',
        'pay_frequency',
        'standard_hours_per_week',
        'commission_rate',
        'commission_cap',
        'tax_handling',
        'pension_enabled',
        'pension_employee_rate',
        'nhf_enabled',
        'nhis_enabled',
        'usage_count',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'role' => UserRole::class,
        'employment_type' => EmploymentType::class,
        'pay_type' => PayType::class,
        'pay_frequency' => PayFrequency::class,
        'tax_handling' => TaxHandling::class,
        'pay_amount' => 'decimal:2',
        'standard_hours_per_week' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_cap' => 'decimal:2',
        'pension_employee_rate' => 'decimal:2',
        'pension_enabled' => 'boolean',
        'nhf_enabled' => 'boolean',
        'nhis_enabled' => 'boolean',
        'usage_count' => 'integer',
    ];

    protected $appends = [
        'role_label',
        'employment_type_label',
        'pay_type_label',
        'pay_frequency_label',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeAvailableFor($query, int $tenantId)
    {
        return $query->where(function ($q) use ($tenantId) {
            $q->where('is_system', true)
                ->orWhere('tenant_id', $tenantId);
        });
    }

    public function scopeSystemTemplates($query)
    {
        return $query->where('is_system', true)->whereNull('tenant_id');
    }

    public function scopeTenantTemplates($query, int $tenantId)
    {
        return $query->where('is_system', false)->where('tenant_id', $tenantId);
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Convert template to form data array for frontend
     */
    public function toFormData(): array
    {
        return [
            'role' => $this->role,
            'employment_type' => $this->employment_type,
            'position_title' => $this->position_title,
            'department' => $this->department,
            'pay_type' => $this->pay_type,
            'pay_amount' => $this->pay_amount,
            'pay_frequency' => $this->pay_frequency,
            'standard_hours_per_week' => $this->standard_hours_per_week,
            'commission_rate' => $this->commission_rate,
            'commission_cap' => $this->commission_cap,
            'tax_handling' => $this->tax_handling,
            'pension_enabled' => $this->pension_enabled,
            'pension_employee_rate' => $this->pension_employee_rate,
            'nhf_enabled' => $this->nhf_enabled,
            'nhis_enabled' => $this->nhis_enabled,
        ];
    }

    public function getRoleLabelAttribute(): string
    {
        return $this->role?->label() ?? '';
    }

    public function getEmploymentTypeLabelAttribute(): string
    {
        return $this->employment_type?->label() ?? '';
    }

    public function getPayTypeLabelAttribute(): string
    {
        return $this->pay_type?->label() ?? '';
    }

    public function getPayFrequencyLabelAttribute(): string
    {
        return $this->pay_frequency?->label() ?? '';
    }

    public function isSystemTemplate(): bool
    {
        return $this->is_system && $this->tenant_id === null;
    }
}
