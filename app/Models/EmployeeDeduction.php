<?php

namespace App\Models;

use App\Enums\DeductionCalculationBase;
use App\Enums\DeductionCalculationType;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class EmployeeDeduction extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'deduction_type_id',
        'amount',
        'rate',
        'total_target',
        'total_deducted',
        'effective_from',
        'effective_to',
        'is_active',
        'custom_rules',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'rate' => 'decimal:4',
        'total_target' => 'decimal:2',
        'total_deducted' => 'decimal:2',
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

    public function deductionType(): BelongsTo
    {
        return $this->belongsTo(DeductionTypeModel::class, 'deduction_type_id');
    }

    public function scopeActiveOn($query, Carbon $date)
    {
        return $query->where('is_active', true)
            ->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date);
            });
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeIncomplete($query)
    {
        return $query->whereNotNull('total_target')
            ->whereColumn('total_deducted', '<', 'total_target');
    }

    public function calculateAmount(array $amounts = []): float
    {
        $type = $this->deductionType;

        $baseAmount = match ($type->calculation_base) {
            DeductionCalculationBase::GROSS => $amounts['gross'] ?? 0,
            DeductionCalculationBase::BASIC => $amounts['basic'] ?? 0,
            DeductionCalculationBase::TAXABLE => $amounts['taxable'] ?? 0,
            DeductionCalculationBase::PENSIONABLE => $amounts['pensionable'] ?? 0,
            DeductionCalculationBase::NET => $amounts['net'] ?? 0,
            default => $amounts['gross'] ?? 0,
        };

        $calculatedAmount = match ($type->calculation_type) {
            DeductionCalculationType::FIXED => (float) ($this->amount ?? $type->default_amount ?? 0),
            DeductionCalculationType::PERCENTAGE => $baseAmount * (($this->rate ?? $type->default_rate ?? 0) / 100),
            DeductionCalculationType::TIERED => $this->calculateTieredAmount($baseAmount),
            DeductionCalculationType::FORMULA => $this->evaluateFormula($amounts),
            default => 0,
        };

        if ($type->max_amount && $calculatedAmount > $type->max_amount) {
            $calculatedAmount = (float) $type->max_amount;
        }

        if ($this->total_target) {
            $remaining = $this->total_target - $this->total_deducted;
            if ($calculatedAmount > $remaining) {
                $calculatedAmount = max(0, $remaining);
            }
        }

        return $calculatedAmount;
    }

    protected function calculateTieredAmount(float $baseAmount): float
    {
        return 0;
    }

    protected function evaluateFormula(array $amounts): float
    {
        return 0;
    }

    public function recordDeduction(float $amount): void
    {
        $this->total_deducted += $amount;
        $this->save();

        if ($this->total_target && $this->total_deducted >= $this->total_target) {
            $this->is_active = false;
            $this->save();
        }
    }

    public function getRemainingBalance(): ?float
    {
        if (!$this->total_target) {
            return null;
        }

        return max(0, $this->total_target - $this->total_deducted);
    }

    public function isComplete(): bool
    {
        if (!$this->total_target) {
            return false;
        }

        return $this->total_deducted >= $this->total_target;
    }
}
