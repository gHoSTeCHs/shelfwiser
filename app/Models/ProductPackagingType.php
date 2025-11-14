<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPackagingType extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'name',
        'display_name',
        'units_per_package',
        'is_sealed_package',
        'price',
        'cost_price',
        'is_base_unit',
        'can_break_down',
        'breaks_into_packaging_type_id',
        'min_order_quantity',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'units_per_package' => 'integer',
        'is_sealed_package' => 'boolean',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'is_base_unit' => 'boolean',
        'can_break_down' => 'boolean',
        'min_order_quantity' => 'integer',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'price_per_unit',
        'has_discount',
        'discount_percentage',
    ];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function breaksInto(): BelongsTo
    {
        return $this->belongsTo(ProductPackagingType::class, 'breaks_into_packaging_type_id');
    }

    /**
     * Get the price per base unit for this packaging type
     */
    public function getPricePerUnitAttribute(): float
    {
        if ($this->units_per_package <= 0) {
            return 0;
        }

        return round($this->price / $this->units_per_package, 2);
    }

    /**
     * Check if this packaging offers a discount compared to base unit
     */
    public function getHasDiscountAttribute(): bool
    {
        $baseUnit = $this->productVariant->packagingTypes()
            ->where('is_base_unit', true)
            ->first();

        if (!$baseUnit || $this->is_base_unit) {
            return false;
        }

        $equivalentBasePrice = $baseUnit->price * $this->units_per_package;
        return $this->price < $equivalentBasePrice;
    }

    /**
     * Get the discount percentage compared to base unit
     */
    public function getDiscountPercentageAttribute(): float
    {
        $baseUnit = $this->productVariant->packagingTypes()
            ->where('is_base_unit', true)
            ->first();

        if (!$baseUnit || $this->is_base_unit) {
            return 0;
        }

        $equivalentBasePrice = $baseUnit->price * $this->units_per_package;

        if ($equivalentBasePrice <= 0) {
            return 0;
        }

        $discount = (($equivalentBasePrice - $this->price) / $equivalentBasePrice) * 100;
        return round(max(0, $discount), 2);
    }
}
