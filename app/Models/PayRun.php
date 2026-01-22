<?php

namespace App\Models;

use App\Enums\PayRunItemStatus;
use App\Enums\PayRunStatus;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class PayRun extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'payroll_period_id',
        'pay_calendar_id',
        'reference',
        'name',
        'status',
        'employee_count',
        'total_gross',
        'total_deductions',
        'total_net',
        'total_employer_costs',
        'calculated_by',
        'calculated_at',
        'approved_by',
        'approved_at',
        'completed_by',
        'completed_at',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'status' => PayRunStatus::class,
        'calculated_at' => 'datetime',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
        'total_gross' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_net' => 'decimal:2',
        'total_employer_costs' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (PayRun $payRun) {
            if (! $payRun->reference) {
                $payRun->reference = self::generateReference($payRun->tenant_id);
            }
        });
    }

    public static function generateReference(int $tenantId): string
    {
        $prefix = 'PR';
        $date = now()->format('Ymd');

        return DB::transaction(function () use ($prefix, $date, $tenantId) {
            $lastPayRun = self::where('tenant_id', $tenantId)
                ->whereDate('created_at', today())
                ->lockForUpdate()
                ->orderByDesc('id')
                ->first();

            if ($lastPayRun && preg_match('/PR-\d{8}-(\d{4})$/', $lastPayRun->reference, $matches)) {
                $sequence = (int) $matches[1] + 1;
            } else {
                $sequence = 1;
            }

            return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function payCalendar(): BelongsTo
    {
        return $this->belongsTo(PayCalendar::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PayRunItem::class);
    }

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    public function calculatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeWithStatus(Builder $query, PayRunStatus $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', PayRunStatus::DRAFT);
    }

    public function scopePendingApproval(Builder $query): Builder
    {
        return $query->where('status', PayRunStatus::PENDING_APPROVAL);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', PayRunStatus::COMPLETED);
    }

    public function canBeCalculated(): bool
    {
        return in_array($this->status, [PayRunStatus::DRAFT, PayRunStatus::PENDING_REVIEW]);
    }

    public function canBeApproved(): bool
    {
        return $this->status === PayRunStatus::PENDING_APPROVAL;
    }

    public function canBeCompleted(): bool
    {
        return $this->status === PayRunStatus::APPROVED;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            PayRunStatus::DRAFT,
            PayRunStatus::PENDING_REVIEW,
            PayRunStatus::PENDING_APPROVAL,
        ]);
    }

    public function isDraft(): bool
    {
        return $this->status === PayRunStatus::DRAFT;
    }

    public function isCompleted(): bool
    {
        return $this->status === PayRunStatus::COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === PayRunStatus::CANCELLED;
    }

    public function updateTotals(): void
    {
        $items = $this->items()->where('status', PayRunItemStatus::CALCULATED)->get();

        $this->update([
            'employee_count' => $items->count(),
            'total_gross' => $items->sum('gross_earnings'),
            'total_deductions' => $items->sum('total_deductions'),
            'total_net' => $items->sum('net_pay'),
            'total_employer_costs' => $items->sum('total_employer_cost'),
        ]);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->status->label();
    }

    public function getStatusColorAttribute(): string
    {
        return $this->status->color();
    }
}
