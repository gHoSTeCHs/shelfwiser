<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Customer extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tenant_id',
        'preferred_shop_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'is_active',
        'marketing_opt_in',
        'account_balance',
        'credit_limit',
        'total_purchases',
        'last_purchase_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'marketing_opt_in' => 'boolean',
        'password' => 'hashed',
        'account_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'total_purchases' => 'decimal:2',
        'last_purchase_at' => 'datetime',
    ];

    /**
     * Get the tenant that owns the customer.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the customer's preferred shop.
     */
    public function preferredShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'preferred_shop_id');
    }

    /**
     * Get all addresses for the customer.
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * Get all orders for the customer.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    /**
     * Get all carts for the customer.
     */
    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class, 'customer_id');
    }

    /**
     * Scope a query to only include active customers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by tenant.
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Get the customer's full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get the customer's preferred shop or fallback to first active shop.
     */
    public function getPreferredShopOrDefault(): ?Shop
    {
        if ($this->preferredShop) {
            return $this->preferredShop;
        }

        return $this->tenant
            ->shops()
            ->where('is_active', true)
            ->first();
    }

    /**
     * Check if customer has verified their email.
     */
    public function hasVerifiedEmail(): bool
    {
        return ! is_null($this->email_verified_at);
    }

    /**
     * Mark the given customer's email as verified.
     */
    public function markEmailAsVerified(): bool
    {
        return $this->forceFill([
            'email_verified_at' => $this->freshTimestamp(),
        ])->save();
    }

    /**
     * Get all credit transactions for the customer
     */
    public function creditTransactions(): HasMany
    {
        return $this->hasMany(CustomerCreditTransaction::class);
    }

    /**
     * Get available credit remaining for customer
     */
    public function availableCredit(): ?float
    {
        if (! $this->credit_limit) {
            return null;
        }

        return max(0, (float) $this->credit_limit - (float) $this->account_balance);
    }

    /**
     * Check if customer can make a purchase on credit
     */
    public function canPurchaseOnCredit(float $amount): bool
    {
        if (! $this->credit_limit) {
            return true;
        }

        return ((float) $this->account_balance + $amount) <= (float) $this->credit_limit;
    }

    /**
     * Get all unpaid orders for customer
     */
    public function unpaidOrders()
    {
        return $this->orders()
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->orderBy('created_at');
    }
}
