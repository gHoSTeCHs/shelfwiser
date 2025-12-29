<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderItem extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'order_id',
        'tenant_id',
        'product_variant_id',
        'product_packaging_type_id',
        'sellable_type',
        'sellable_id',
        'packaging_description',
        'quantity',
        'unit_price',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->calculateTotal();
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function packagingType(): BelongsTo
    {
        return $this->belongsTo(ProductPackagingType::class, 'product_packaging_type_id');
    }

    public function sellable(): MorphTo
    {
        return $this->morphTo();
    }

    public function isProduct(): bool
    {
        return $this->sellable_type === ProductVariant::class;
    }

    public function isService(): bool
    {
        return $this->sellable_type === ServiceVariant::class;
    }

    public function calculateTotal(): void
    {
        $subtotal = $this->unit_price * $this->quantity;
        $this->total_amount = $subtotal + $this->tax_amount - $this->discount_amount;
    }

    public function getPackageQuantityAttribute(): ?int
    {
        if (! $this->product_packaging_type_id) {
            return null;
        }

        $packagingType = $this->packagingType;
        if (! $packagingType) {
            return null;
        }

        return (int) ($this->quantity / $packagingType->units_per_package);
    }

    public function getProfitAttribute(): float
    {
        $cost = $this->quantity * ($this->productVariant->cost_price ?? 0);

        return $this->total_amount - $cost;
    }

    public function getMarginPercentageAttribute(): float
    {
        if ($this->total_amount <= 0) {
            return 0;
        }

        return ($this->profit / $this->total_amount) * 100;
    }

    public function getProductNameAttribute(): string
    {
        if ($this->isService()) {
            return $this->sellable?->service?->name ?? 'Unknown Service';
        }

        return $this->productVariant?->product?->name ?? 'Unknown Product';
    }

    public function getVariantNameAttribute(): string
    {
        if ($this->isService()) {
            return $this->sellable?->name ?? 'Default Variant';
        }

        return $this->productVariant?->name ?? 'Default Variant';
    }

    public function getSkuAttribute(): string
    {
        if ($this->isService()) {
            return 'SVC-'.$this->sellable_id;
        }

        return $this->productVariant?->sku ?? '';
    }
}
