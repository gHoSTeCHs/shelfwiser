<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cart extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'tenant_id',
        'shop_id',
        'customer_id',
        'session_id',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
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
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeForCustomer(Builder $query, int $customerId): Builder
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeForSession(Builder $query, string $sessionId): Builder
    {
        return $query->where('session_id', $sessionId);
    }

    public function loadOrderRelations(): static
    {
        return $this->load([
            'items.productVariant.product',
            'items.packagingType',
            'items.sellable' => function ($morphTo) {
                $morphTo->morphWith([
                    \App\Models\ServiceVariant::class => ['service'],
                ]);
            },
        ]);
    }

    /**
     * Load relations needed by the storefront JSON API cart endpoints.
     * Differs from loadOrderRelations() in that it includes product.images
     * for image URLs in the serialized cart item response.
     */
    public function loadApiCartRelations(): static
    {
        return $this->load(['items.productVariant.product.images', 'items.sellable']);
    }
}
