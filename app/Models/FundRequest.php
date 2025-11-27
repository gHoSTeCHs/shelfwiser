<?php

namespace App\Models;

use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FundRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'shop_id',
        'tenant_id',
        'request_type',
        'amount',
        'description',
        'status',
        'requested_at',
        'approved_by_user_id',
        'approved_at',
        'rejection_reason',
        'disbursed_by_user_id',
        'disbursed_at',
        'receipt_uploaded',
        'notes',
    ];

    protected $casts = [
        'request_type' => FundRequestType::class,
        'status' => FundRequestStatus::class,
        'amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'receipt_uploaded' => 'boolean',
    ];

    /**
     * Employee who requested the funds
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Shop for which funds are requested
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Tenant that owns this fund request
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
     * User who disbursed the funds
     */
    public function disbursedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by_user_id');
    }

    /**
     * Check if request is pending
     */
    public function isPending(): bool
    {
        return $this->status === FundRequestStatus::PENDING;
    }

    /**
     * Check if request is approved
     */
    public function isApproved(): bool
    {
        return $this->status === FundRequestStatus::APPROVED;
    }

    /**
     * Check if request is disbursed
     */
    public function isDisbursed(): bool
    {
        return $this->status === FundRequestStatus::DISBURSED;
    }

    /**
     * Check if request is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === FundRequestStatus::REJECTED;
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
    public function scopeWithStatus($query, FundRequestStatus $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get pending requests
     */
    public function scopePending($query)
    {
        return $query->where('status', FundRequestStatus::PENDING);
    }
}
