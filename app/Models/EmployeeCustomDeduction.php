<?php

namespace App\Models;

use App\Enums\DeductionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeCustomDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'deduction_name',
        'deduction_type',
        'amount',
        'percentage',
        'is_active',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'deduction_type' => DeductionType::class,
        'amount' => 'decimal:2',
        'percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope to filter by tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to filter by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get active deductions
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->where('effective_from', '<=', now())
                    ->where(function ($q2) {
                        $q2->whereNull('effective_to')
                            ->orWhere('effective_to', '>=', now());
                    });
            });
    }

    /**
     * Check if deduction is currently effective
     */
    public function isEffective(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->effective_from > $now) {
            return false;
        }

        if ($this->effective_to && $this->effective_to < $now) {
            return false;
        }

        return true;
    }

    /**
     * Calculate deduction amount for a given gross pay
     */
    public function calculateDeduction(float $grossPay): float
    {
        if (! $this->isEffective()) {
            return 0;
        }

        return match ($this->deduction_type) {
            DeductionType::FIXED_AMOUNT, DeductionType::LOAN_REPAYMENT, DeductionType::ADVANCE_REPAYMENT, DeductionType::INSURANCE, DeductionType::UNION_DUES, DeductionType::SAVINGS, DeductionType::OTHER => (float) $this->amount,
            DeductionType::PERCENTAGE => ($grossPay * (float) $this->percentage) / 100,
        };
    }
}
