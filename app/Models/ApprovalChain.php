<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalChain extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'entity_type',
        'minimum_amount',
        'maximum_amount',
        'approval_steps',
        'is_active',
        'priority',
        'description',
    ];

    protected $casts = [
        'minimum_amount' => 'decimal:2',
        'maximum_amount' => 'decimal:2',
        'approval_steps' => 'array',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function approvalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    /**
     * Check if this chain applies to a given amount
     */
    public function appliesTo(float $amount): bool
    {
        $minMatches = is_null($this->minimum_amount) || $amount >= $this->minimum_amount;
        $maxMatches = is_null($this->maximum_amount) || $amount <= $this->maximum_amount;

        return $minMatches && $maxMatches;
    }

    /**
     * Get the number of approval steps required
     */
    public function getStepCount(): int
    {
        return count($this->approval_steps ?? []);
    }

    /**
     * Get required role level for a specific step
     */
    public function getRequiredRoleLevel(int $step): ?int
    {
        $steps = $this->approval_steps ?? [];
        return $steps[$step]['role_level'] ?? null;
    }

    /**
     * Scope to filter by tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to filter by entity type
     */
    public function scopeForEntityType($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    /**
     * Scope to get active chains
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by priority
     */
    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }
}
