<?php

namespace App\Models;

use App\Enums\PayrollStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PayrollPeriod extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'period_name',
        'start_date',
        'end_date',
        'payment_date',
        'status',
        'processed_by_user_id',
        'processed_at',
        'approved_by_user_id',
        'approved_at',
        'total_gross_pay',
        'total_deductions',
        'total_net_pay',
        'employee_count',
        'includes_general_manager',
        'requires_owner_approval',
        'notes',
    ];

    protected $casts = [
        'status' => PayrollStatus::class,
        'start_date' => 'date',
        'end_date' => 'date',
        'payment_date' => 'date',
        'processed_at' => 'datetime',
        'approved_at' => 'datetime',
        'total_gross_pay' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_net_pay' => 'decimal:2',
        'employee_count' => 'integer',
        'includes_general_manager' => 'boolean',
        'requires_owner_approval' => 'boolean',
    ];

    /**
     * Tenant that owns this payroll period
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Shop for this payroll period (null for company-wide)
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * User who processed the payroll
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }

    /**
     * User who approved the payroll
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /**
     * Payslips in this period
     */
    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * Check if payroll is draft
     */
    public function isDraft(): bool
    {
        return $this->status === PayrollStatus::DRAFT;
    }

    /**
     * Check if payroll is processed
     */
    public function isProcessed(): bool
    {
        return $this->status === PayrollStatus::PROCESSED;
    }

    /**
     * Check if payroll is approved
     */
    public function isApproved(): bool
    {
        return $this->status === PayrollStatus::APPROVED;
    }

    /**
     * Check if payroll is paid
     */
    public function isPaid(): bool
    {
        return $this->status === PayrollStatus::PAID;
    }

    /**
     * Scope to filter by tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to filter by shop
     */
    public function scopeForShop($query, int $shopId)
    {
        return $query->where('shop_id', $shopId);
    }

    /**
     * Scope to filter by status
     */
    public function scopeWithStatus($query, PayrollStatus $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get pending approval
     */
    public function scopePendingApproval($query)
    {
        return $query->where('status', PayrollStatus::PROCESSED);
    }
}
