<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalRequest extends Model
{
    use HasFactory;

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

    protected $casts = [
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

    /**
     * Check if approval is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if approval is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if approval is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Add approval action to history
     */
    public function recordApprovalAction(User $user, string $action, ?string $notes = null): void
    {
        $history = $this->approval_history ?? [];
        $history[] = [
            'step' => $this->current_step,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => $action, // 'approved', 'rejected'
            'notes' => $notes,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->approval_history = $history;
        $this->save();
    }

    /**
     * Scope to filter by tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to filter by status
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get pending requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get requests for a specific user to approve
     */
    public function scopeForApprover($query, User $user)
    {
        return $query->where('status', 'pending')
            ->whereHas('approvalChain', function ($q) use ($user) {
                // This would need more complex logic to check if user can approve current step
                // For now, we'll handle this in the service layer
            });
    }
}
