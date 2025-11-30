<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WageAdvanceRepayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'wage_advance_id',
        'tenant_id',
        'payroll_period_id',
        'amount',
        'repayment_date',
        'payment_method',
        'reference_number',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'repayment_date' => 'date',
    ];

    public function wageAdvance(): BelongsTo
    {
        return $this->belongsTo(WageAdvance::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Scope to filter by tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to filter by wage advance
     */
    public function scopeForWageAdvance($query, int $wageAdvanceId)
    {
        return $query->where('wage_advance_id', $wageAdvanceId);
    }
}
