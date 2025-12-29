<?php

namespace App\Models;

use App\Enums\EarningCalculationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class EmployeeEarning extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'earning_type_id',
        'amount',
        'rate',
        'effective_from',
        'effective_to',
        'is_active',
        'custom_rules',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'rate' => 'decimal:4',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'is_active' => 'boolean',
        'custom_rules' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function earningType(): BelongsTo
    {
        return $this->belongsTo(EarningType::class);
    }

    /**
     * Scope to filter earnings active on a specific date
     */
    public function scopeActiveOn($query, Carbon $date)
    {
        return $query->where('is_active', true)
            ->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date);
            });
    }

    /**
     * Scope to filter for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter for a specific tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Calculate the amount for this earning based on its type and context
     */
    public function calculateAmount(float $baseSalary = 0, array $context = []): float
    {
        $type = $this->earningType;

        return match ($type->calculation_type) {
            EarningCalculationType::FIXED => (float) ($this->amount ?? $type->default_amount ?? 0),
            EarningCalculationType::PERCENTAGE => $baseSalary * (($this->rate ?? $type->default_rate ?? 0) / 100),
            EarningCalculationType::HOURLY => ($this->rate ?? $type->default_rate ?? 0) * ($context['hours'] ?? 0),
            EarningCalculationType::FORMULA => $this->evaluateFormula($context),
            default => 0,
        };
    }

    /**
     * Evaluate a formula-based earning (placeholder for future implementation)
     */
    protected function evaluateFormula(array $context): float
    {
        return 0;
    }
}
