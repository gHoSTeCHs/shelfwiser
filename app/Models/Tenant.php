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
        'subscription_plan',
        'trial_ends_at',
        'subscription_ends_at',
        'max_shops',
        'max_users',
        'max_products',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'max_shops' => 'integer',
        'max_users' => 'integer',
        'max_products' => 'integer',
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

    /**
     * Check if the tenant is on trial.
     */
    public function isOnTrial(): bool
    {
        return $this->subscription_plan === 'trial' &&
               $this->trial_ends_at &&
               $this->trial_ends_at->isFuture();
    }

    /**
     * Check if the tenant's trial has expired.
     */
    public function isTrialExpired(): bool
    {
        return $this->subscription_plan === 'trial' &&
               $this->trial_ends_at &&
               $this->trial_ends_at->isPast();
    }

    /**
     * Check if the tenant has an active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        if ($this->isOnTrial()) {
            return true;
        }

        return $this->subscription_ends_at && $this->subscription_ends_at->isFuture();
    }

    /**
     * Check if the tenant has reached their shop limit.
     */
    public function hasReachedShopLimit(): bool
    {
        return $this->shops()->count() >= $this->max_shops;
    }

    /**
     * Check if the tenant has reached their user limit.
     */
    public function hasReachedUserLimit(): bool
    {
        return $this->users()->count() >= $this->max_users;
    }

    /**
     * Check if the tenant has reached their product limit.
     */
    public function hasReachedProductLimit(): bool
    {
        return Product::where('tenant_id', $this->id)->count() >= $this->max_products;
    }

    /**
     * Get remaining days of subscription or trial.
     */
    public function getRemainingDays(): int
    {
        $endDate = $this->isOnTrial() ? $this->trial_ends_at : $this->subscription_ends_at;

        if (!$endDate) {
            return 0;
        }

        return max(0, now()->diffInDays($endDate, false));
    }
}
