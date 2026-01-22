<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryLocation extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'tenant_id',
        'shop_id',
        'product_variant_id',
        'location_type',
        'location_id',
        'quantity',
        'reserved_quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reserved_quantity' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (InventoryLocation $inventoryLocation) {
            if ($inventoryLocation->reserved_quantity > $inventoryLocation->quantity) {
                throw new \InvalidArgumentException(
                    'Reserved quantity cannot exceed total quantity. '.
                    "Reserved: {$inventoryLocation->reserved_quantity}, Total: {$inventoryLocation->quantity}"
                );
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

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function location(): MorphTo
    {
        return $this->morphTo();
    }

    public function getAvailableQuantityAttribute(): int
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    public function scopeForTenant(Builder $query, Tenant $tenant): Builder
    {
        return $query->where('tenant_id', $tenant->id);
    }

    /**
     * Scope a query to filter by product variant ID.
     */
    public function scopeByVariant(Builder $query, int $variantId): Builder
    {
        return $query->where('product_variant_id', $variantId);
    }

    /**
     * Scope a query to filter by shop ID.
     */
    public function scopeByShop(Builder $query, int $shopId): Builder
    {
        return $query->where('shop_id', $shopId);
    }

    /**
     * Scope a query to only include locations with stock.
     */
    public function scopeWithStock(Builder $query): Builder
    {
        return $query->where('quantity', '>', 0);
    }
}
