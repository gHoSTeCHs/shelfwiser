<?php

namespace App\Models;

use App\Enums\WageAdvanceStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WageAdvance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'shop_id',
        'tenant_id',
        'amount_requested',
        'amount_approved',
        'status',
        'reason',
        'requested_at',
        'approved_by_user_id',
        'approved_at',
        'rejection_reason',
        'disbursed_by_user_id',
        'disbursed_at',
        'repayment_start_date',
        'repayment_installments',
        'amount_repaid',
        'fully_repaid_at',
        'notes',
    ];

    protected $casts = [
        'status' => WageAdvanceStatus::class,
        'amount_requested' => 'decimal:2',
        'amount_approved' => 'decimal:2',
        'amount_repaid' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'repayment_start_date' => 'date',
        'repayment_installments' => 'integer',
        'fully_repaid_at' => 'datetime',
    ];

    /**
     * Employee who requested the advance
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Shop where employee works
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Tenant that owns this wage advance
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * User who approved the request
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /**
     * User who disbursed the advance
     */
    public function disbursedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by_user_id');
    }

    /**
     * Get remaining balance to repay
     */
    public function getRemainingBalance(): float
    {
        $approved = (float) ($this->amount_approved ?? $this->amount_requested);
        $repaid = (float) $this->amount_repaid;

        return max(0, $approved - $repaid);
    }

    /**
     * Get repayment amount per installment
     */
    public function getInstallmentAmount(): float
    {
        if ($this->repayment_installments <= 0) {
            return 0;
        }
        $approved = (float) ($this->amount_approved ?? $this->amount_requested);

        return $approved / $this->repayment_installments;
    }

    /**
     * Check if advance is fully repaid
     */
    public function isFullyRepaid(): bool
    {
        return $this->getRemainingBalance() <= 0.01;
    }

    /**
     * Check if advance is pending
     */
    public function isPending(): bool
    {
        return $this->status === WageAdvanceStatus::PENDING;
    }

    /**
     * Check if advance is approved
     */
    public function isApproved(): bool
    {
        return $this->status === WageAdvanceStatus::APPROVED;
    }

    /**
     * Check if advance is disbursed
     */
    public function isDisbursed(): bool
    {
        return $this->status === WageAdvanceStatus::DISBURSED;
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
     * Scope to filter by status
     */
    public function scopeWithStatus($query, WageAdvanceStatus $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get pending requests
     */
    public function scopePending($query)
    {
        return $query->where('status', WageAdvanceStatus::PENDING);
    }

    /**
     * Scope to get active advances (disbursed or repaying)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            WageAdvanceStatus::DISBURSED,
            WageAdvanceStatus::REPAYING,
        ]);
    }
}
