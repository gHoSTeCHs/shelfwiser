<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_variant_id',
        'quantity',
        'unit_price',
        'discount_amount',
        'tax_amount',
        'total_amount',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->calculateTotal();
        });
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function calculateTotal(): void
    {
        $subtotal = $this->unit_price * $this->quantity;
        $this->total_amount = $subtotal + $this->tax_amount - $this->discount_amount;
    }

    public function getProductNameAttribute(): string
    {
        return $this->productVariant->product->name ?? 'Unknown Product';
    }

    public function getVariantNameAttribute(): string
    {
        return $this->productVariant->name ?? 'Default Variant';
    }

    public function getSkuAttribute(): string
    {
        return $this->productVariant->sku ?? '';
    }
}
