<?php

namespace App\Models;

use App\Enums\ConnectionApprovalMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierProfile extends Model
{
    protected $fillable = [
        'tenant_id',
        'is_enabled',
        'business_registration',
        'tax_id',
        'payment_terms',
        'lead_time_days',
        'minimum_order_value',
        'connection_approval_mode',
        'settings',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'lead_time_days' => 'integer',
        'minimum_order_value' => 'decimal:2',
        'connection_approval_mode' => ConnectionApprovalMode::class,
        'settings' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function catalogItems(): HasMany
    {
        return $this->hasMany(SupplierCatalogItem::class, 'supplier_tenant_id', 'tenant_id');
    }

    public function connections(): HasMany
    {
        return $this->hasMany(SupplierConnection::class, 'supplier_tenant_id', 'tenant_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_tenant_id', 'tenant_id');
    }

    public function canAutoApproveConnections(): bool
    {
        return $this->connection_approval_mode === ConnectionApprovalMode::AUTO;
    }

    public function canUserApproveConnection($user): bool
    {
        if ($this->canAutoApproveConnections()) {
            return true;
        }

        $requiredRole = $this->connection_approval_mode->requiredRole();

        return $user->role->level() >= $requiredRole->level();
    }
}
