<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payslip extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'payroll_period_id',
        'pay_run_id',
        'user_id',
        'tenant_id',
        'shop_id',
        'basic_salary',
        'gross_earnings',
        'regular_hours',
        'regular_pay',
        'overtime_hours',
        'overtime_pay',
        'bonus',
        'commission',
        'gross_pay',
        'income_tax',
        'pension_employee',
        'pension_employer',
        'nhf',
        'nhis',
        'wage_advance_deduction',
        'other_deductions',
        'total_deductions',
        'net_pay',
        'ytd_gross',
        'ytd_tax',
        'ytd_pension',
        'ytd_net',
        'earnings_breakdown',
        'deductions_breakdown',
        'tax_breakdown',
        'tax_calculation',
        'employer_contributions',
        'notes',
        'status',
        'cancellation_reason',
        'cancelled_by',
        'cancelled_at',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'gross_earnings' => 'decimal:2',
        'regular_hours' => 'decimal:2',
        'regular_pay' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'bonus' => 'decimal:2',
        'commission' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'income_tax' => 'decimal:2',
        'pension_employee' => 'decimal:2',
        'pension_employer' => 'decimal:2',
        'nhf' => 'decimal:2',
        'nhis' => 'decimal:2',
        'wage_advance_deduction' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'ytd_gross' => 'decimal:2',
        'ytd_tax' => 'decimal:2',
        'ytd_pension' => 'decimal:2',
        'ytd_net' => 'decimal:2',
        'earnings_breakdown' => 'array',
        'deductions_breakdown' => 'array',
        'tax_breakdown' => 'array',
        'tax_calculation' => 'array',
        'employer_contributions' => 'array',
        'cancelled_at' => 'datetime',
    ];

    /**
     * Payroll period this payslip belongs to
     */
    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    /**
     * Pay run this payslip was generated from
     */
    public function payRun(): BelongsTo
    {
        return $this->belongsTo(PayRun::class);
    }

    /**
     * Employee this payslip is for
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Tenant that owns this payslip
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Shop this payslip is for
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get total earnings
     */
    public function getTotalEarnings(): float
    {
        return (float) $this->gross_pay;
    }

    /**
     * Get employer contributions
     */
    public function getEmployerContributions(): float
    {
        return (float) $this->pension_employer;
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
     * Scope to filter by payroll period
     */
    public function scopeForPeriod($query, int $periodId)
    {
        return $query->where('payroll_period_id', $periodId);
    }

    /**
     * User who cancelled this payslip
     */
    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Cancel this payslip with a reason (soft-delete)
     */
    public function cancel(string $reason, int $cancelledBy): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancellation_reason' => $reason,
            'cancelled_by' => $cancelledBy,
            'cancelled_at' => now(),
        ]);
    }

    /**
     * Check if this payslip is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled' || $this->trashed();
    }
}
