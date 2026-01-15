<?php

namespace App\Models;

use App\Enums\ApprovalRequestStatus;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalRequest extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'tenant_id',
        'approval_chain_id',
        'approvable_type',
        'approvable_id',
        'requested_by',
        'status',
        'current_step',
        'approval_history',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'status' => ApprovalRequestStatus::class,
        'current_step' => 'integer',
        'approval_history' => 'array',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function approvalChain(): BelongsTo
    {
        return $this->belongsTo(ApprovalChain::class);
    }

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function isPending(): bool
    {
        return $this->status === ApprovalRequestStatus::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === ApprovalRequestStatus::APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === ApprovalRequestStatus::REJECTED;
    }

    public function recordApprovalAction(User $user, string $action, ?string $notes = null): void
    {
        $history = $this->approval_history ?? [];
        $history[] = [
            'step' => $this->current_step,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => $action,
            'notes' => $notes,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->approval_history = $history;
        $this->save();
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeWithStatus($query, ApprovalRequestStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', ApprovalRequestStatus::PENDING);
    }

    public function scopeForApprover($query, User $user)
    {
        return $query->where('status', ApprovalRequestStatus::PENDING)
            ->whereHas('approvalChain', function ($q) use ($user) {
            });
    }
}
