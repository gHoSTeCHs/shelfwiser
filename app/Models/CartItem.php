<?php

namespace App\Models;

use App\Enums\MaterialOption;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

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
        'sellable_type',
        'sellable_id',
        'quantity',
        'price',
        'material_option',
        'selected_addons',
        'base_price',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'base_price' => 'decimal:2',
        'selected_addons' => 'array',
        'material_option' => MaterialOption::class,
    ];

    /**
     * Get the cart that owns the cart item
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * Get the sellable item (ProductVariant or ServiceVariant)
     */
    public function sellable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the product variant for the cart item (backward compatible)
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the packaging type for the cart item
     */
    public function packagingType(): BelongsTo
    {
        return $this->belongsTo(ProductPackagingType::class, 'product_packaging_type_id');
    }

    /**
     * Check if item is a product
     */
    public function isProduct(): bool
    {
        return $this->sellable_type === ProductVariant::class;
    }

    /**
     * Check if item is a service
     */
    public function isService(): bool
    {
        return $this->sellable_type === ServiceVariant::class;
    }

    /**
     * Get the subtotal for this cart item
     */
    public function getSubtotalAttribute(): float
    {
        return $this->price * $this->quantity;
    }
}
