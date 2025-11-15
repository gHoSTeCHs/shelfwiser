<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'owner_email',
        'business_type',
        'phone',
        'logo_path',
        'settings',
        'address',
        'is_active',
        'max_users',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function shops(): HasMany
    {
        return $this->hasMany(Shop::class);
    }

    public function supplierProfile(): HasOne
    {
        return $this->hasOne(SupplierProfile::class);
    }

    public function supplierConnections(): HasMany
    {
        return $this->hasMany(SupplierConnection::class, 'supplier_tenant_id');
    }

    public function buyerConnections(): HasMany
    {
        return $this->hasMany(SupplierConnection::class, 'buyer_tenant_id');
    }

    public function purchaseOrdersAsBuyer(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'buyer_tenant_id');
    }

    public function purchaseOrdersAsSupplier(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_tenant_id');
    }

    public function isSupplier(): bool
    {
        return $this->supplierProfile?->is_enabled ?? false;
    }
}
