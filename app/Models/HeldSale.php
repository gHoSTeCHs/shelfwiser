<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class HeldSale extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'hold_reference',
        'customer_id',
        'items',
        'notes',
        'held_by',
        'expires_at',
        'retrieved_at',
        'retrieved_by',
    ];

    protected $casts = [
        'items' => 'array',
        'expires_at' => 'datetime',
        'retrieved_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($heldSale) {
            if (empty($heldSale->expires_at)) {
                $heldSale->expires_at = now()->addHours(24);
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function heldByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'held_by');
    }

    public function retrievedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'retrieved_by');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForShop($query, int $shopId)
    {
        return $query->where('shop_id', $shopId);
    }

    public function scopeActive($query)
    {
        return $query->whereNull('retrieved_at');
    }

    public function scopeExpired($query)
    {
        return $query->whereNull('retrieved_at')
            ->where('expires_at', '<', now());
    }

    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now());
        });
    }

    public function isRetrieved(): bool
    {
        return $this->retrieved_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function getItemCount(): int
    {
        return count($this->items ?? []);
    }

    public function getTotalAmount(): float
    {
        return collect($this->items ?? [])->sum(function ($item) {
            return ($item['unit_price'] ?? 0) * ($item['quantity'] ?? 0);
        });
    }
}
