<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'cart_id',
        'product_variant_id',
        'product_packaging_type_id',
        'quantity',
        'price',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
    ];

    /**
     * Get the cart that owns the cart item.
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * Get the product variant for the cart item.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the packaging type for the cart item.
     */
    public function packagingType(): BelongsTo
    {
        return $this->belongsTo(ProductPackagingType::class, 'product_packaging_type_id');
    }

    /**
     * Get the subtotal for this cart item.
     */
    public function getSubtotalAttribute(): float
    {
        return $this->price * $this->quantity;
    }
}
