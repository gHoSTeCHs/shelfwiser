<?php

namespace App\Models;

use App\Enums\ConnectionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierConnection extends Model
{
    protected $fillable = [
        'supplier_tenant_id',
        'buyer_tenant_id',
        'status',
        'credit_limit',
        'payment_terms_override',
        'buyer_notes',
        'supplier_notes',
        'requested_at',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'status' => ConnectionStatus::class,
        'credit_limit' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function supplierTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'supplier_tenant_id');
    }

    public function buyerTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'buyer_tenant_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function pricingTiers(): HasMany
    {
        return $this->hasMany(SupplierPricingTier::class, 'connection_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_tenant_id', 'supplier_tenant_id')
            ->where('buyer_tenant_id', $this->buyer_tenant_id);
    }

    public function approve($userId): void
    {
        $this->update([
            'status' => ConnectionStatus::APPROVED,
            'approved_at' => now(),
            'approved_by' => $userId,
        ]);
    }

    public function reject(): void
    {
        $this->update([
            'status' => ConnectionStatus::REJECTED,
        ]);
    }

    public function suspend(): void
    {
        $this->update([
            'status' => ConnectionStatus::SUSPENDED,
        ]);
    }

    public function activate(): void
    {
        $this->update([
            'status' => ConnectionStatus::ACTIVE,
        ]);
    }

    public function scopeForSupplier($query, $tenantId)
    {
        return $query->where('supplier_tenant_id', $tenantId);
    }

    public function scopeForBuyer($query, $tenantId)
    {
        return $query->where('buyer_tenant_id', $tenantId);
    }

    public function scopeApproved($query)
    {
        return $query->whereIn('status', [ConnectionStatus::APPROVED, ConnectionStatus::ACTIVE]);
    }

    public function scopePending($query)
    {
        return $query->where('status', ConnectionStatus::PENDING);
    }
}
