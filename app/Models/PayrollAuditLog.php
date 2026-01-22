<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Builder;

class PayrollAuditLog extends Model
{
    use BelongsToTenant;
    const ACTION_PAY_RUN_CREATED = 'pay_run_created';
    const ACTION_PAY_RUN_CALCULATED = 'pay_run_calculated';
    const ACTION_PAY_RUN_SUBMITTED = 'pay_run_submitted';
    const ACTION_PAY_RUN_APPROVED = 'pay_run_approved';
    const ACTION_PAY_RUN_REJECTED = 'pay_run_rejected';
    const ACTION_PAY_RUN_COMPLETED = 'pay_run_completed';
    const ACTION_PAY_RUN_CANCELLED = 'pay_run_cancelled';
    const ACTION_EMPLOYEE_EXCLUDED = 'employee_excluded';
    const ACTION_EMPLOYEE_INCLUDED = 'employee_included';
    const ACTION_ITEM_RECALCULATED = 'item_recalculated';
    const ACTION_PAYSLIP_GENERATED = 'payslip_generated';
    const ACTION_PAYSLIP_CANCELLED = 'payslip_cancelled';
    const ACTION_SETTING_CHANGED = 'setting_changed';
    const ACTION_EARNING_TYPE_CREATED = 'earning_type_created';
    const ACTION_EARNING_TYPE_UPDATED = 'earning_type_updated';
    const ACTION_EARNING_TYPE_DELETED = 'earning_type_deleted';
    const ACTION_DEDUCTION_TYPE_CREATED = 'deduction_type_created';
    const ACTION_DEDUCTION_TYPE_UPDATED = 'deduction_type_updated';
    const ACTION_DEDUCTION_TYPE_DELETED = 'deduction_type_deleted';
    const ACTION_PAY_CALENDAR_CREATED = 'pay_calendar_created';
    const ACTION_PAY_CALENDAR_UPDATED = 'pay_calendar_updated';
    const ACTION_PAY_CALENDAR_DELETED = 'pay_calendar_deleted';

    protected $fillable = [
        'tenant_id',
        'auditable_type',
        'auditable_id',
        'action',
        'actor_id',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForAction(Builder $query, string $action): Builder
    {
        return $query->where('action', $action);
    }

    public function scopeForAuditable(Builder $query, string $type, int $id): Builder
    {
        return $query->where('auditable_type', $type)->where('auditable_id', $id);
    }

    public function scopeByActor(Builder $query, int $actorId): Builder
    {
        return $query->where('actor_id', $actorId);
    }

    public function scopeInDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function getActionLabelAttribute(): string
    {
        return match($this->action) {
            self::ACTION_PAY_RUN_CREATED => 'Pay Run Created',
            self::ACTION_PAY_RUN_CALCULATED => 'Pay Run Calculated',
            self::ACTION_PAY_RUN_SUBMITTED => 'Pay Run Submitted for Approval',
            self::ACTION_PAY_RUN_APPROVED => 'Pay Run Approved',
            self::ACTION_PAY_RUN_REJECTED => 'Pay Run Rejected',
            self::ACTION_PAY_RUN_COMPLETED => 'Pay Run Completed',
            self::ACTION_PAY_RUN_CANCELLED => 'Pay Run Cancelled',
            self::ACTION_EMPLOYEE_EXCLUDED => 'Employee Excluded',
            self::ACTION_EMPLOYEE_INCLUDED => 'Employee Re-included',
            self::ACTION_ITEM_RECALCULATED => 'Item Recalculated',
            self::ACTION_PAYSLIP_GENERATED => 'Payslip Generated',
            self::ACTION_PAYSLIP_CANCELLED => 'Payslip Cancelled',
            self::ACTION_SETTING_CHANGED => 'Setting Changed',
            self::ACTION_EARNING_TYPE_CREATED => 'Earning Type Created',
            self::ACTION_EARNING_TYPE_UPDATED => 'Earning Type Updated',
            self::ACTION_EARNING_TYPE_DELETED => 'Earning Type Deleted',
            self::ACTION_DEDUCTION_TYPE_CREATED => 'Deduction Type Created',
            self::ACTION_DEDUCTION_TYPE_UPDATED => 'Deduction Type Updated',
            self::ACTION_DEDUCTION_TYPE_DELETED => 'Deduction Type Deleted',
            self::ACTION_PAY_CALENDAR_CREATED => 'Pay Calendar Created',
            self::ACTION_PAY_CALENDAR_UPDATED => 'Pay Calendar Updated',
            self::ACTION_PAY_CALENDAR_DELETED => 'Pay Calendar Deleted',
            default => ucwords(str_replace('_', ' ', $this->action)),
        };
    }
}
