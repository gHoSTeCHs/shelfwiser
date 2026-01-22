<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Product Packaging Type Model
 *
 * Represents different packaging configurations for selling product variants.
 * Each packaging type defines how many base units are sold together and at what price.
 *
 * PRICING LOGIC:
 *
 * This model has two price-related concepts that work together:
 *
 * 1. ProductVariant->price (Base Unit Price)
 *    - Represents the price per single base unit (e.g., price per bottle, per can, per item)
 *    - This is the fundamental pricing unit for the product
 *    - Used for inventory valuation and cost calculations
 *    - Example: If selling individual bottles, variant->price might be $2.00 per bottle
 *
 * 2. ProductPackagingType->price (Package Price)
 *    - Represents the total selling price for this specific package configuration
 *    - MAY differ from (units_per_package × variant->price) to enable bulk discounts or premiums
 *    - Allows flexible pricing strategies (bulk discounts, convenience premiums, etc.)
 *    - Example: A 12-pack might be priced at $20 instead of $24 (12 × $2) to offer a bulk discount
 *
 * WHEN TO USE WHICH PRICE:
 *
 * - Use variant->price when:
 *   - Calculating inventory value
 *   - Computing cost of goods sold (COGS)
 *   - Determining base unit profitability
 *   - Comparing prices across different variants
 *
 * - Use packaging->price when:
 *   - Displaying price to customers
 *   - Processing sales transactions
 *   - Calculating order totals
 *   - Applying package-specific pricing strategies
 *
 * PRICING RELATIONSHIPS:
 *
 * - If packaging->price < (units_per_package × variant->price): Bulk discount applied
 * - If packaging->price > (units_per_package × variant->price): Convenience premium applied
 * - If packaging->price = (units_per_package × variant->price): No discount or premium
 *
 * The system calculates these relationships automatically via:
 * - price_per_unit attribute: packaging->price ÷ units_per_package
 * - has_discount attribute: true if package offers savings vs buying individual units
 * - discount_percentage attribute: percentage saved when buying this package
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $product_variant_id
 * @property string $name
 * @property string|null $display_name
 * @property int $units_per_package Number of base units in this package
 * @property bool $is_sealed_package Whether package must be sold as complete unit
 * @property float $price Total selling price for this package (may include bulk discount/premium)
 * @property float|null $cost_price Total cost for this package
 * @property bool $is_base_unit Whether this is the base unit packaging (typically 1 unit)
 * @property bool $can_break_down Whether sealed packages can be broken into smaller units
 * @property int|null $breaks_into_packaging_type_id The packaging type this breaks down into
 * @property int|null $min_order_quantity Minimum quantity that must be ordered
 * @property int $display_order Sort order for display purposes
 * @property bool $is_active Whether this packaging type is currently available
 */
class ProductPackagingType extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
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

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

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
     * Note: Use eager loading with 'productVariant.packagingTypes' to avoid N+1 queries
     */
    public function getHasDiscountAttribute(): bool
    {
        if ($this->is_base_unit) {
            return false;
        }

        $baseUnit = $this->getBaseUnit();

        if (! $baseUnit) {
            return false;
        }

        $equivalentBasePrice = $baseUnit->price * $this->units_per_package;

        return $this->price < $equivalentBasePrice;
    }

    /**
     * Get the discount percentage compared to base unit
     * Note: Use eager loading with 'productVariant.packagingTypes' to avoid N+1 queries
     */
    public function getDiscountPercentageAttribute(): float
    {
        if ($this->is_base_unit) {
            return 0;
        }

        $baseUnit = $this->getBaseUnit();

        if (! $baseUnit) {
            return 0;
        }

        $equivalentBasePrice = $baseUnit->price * $this->units_per_package;

        if ($equivalentBasePrice <= 0) {
            return 0;
        }

        $discount = (($equivalentBasePrice - $this->price) / $equivalentBasePrice) * 100;

        return round(max(0, $discount), 2);
    }

    /**
     * Get the base unit packaging type efficiently
     * Uses eager loaded data if available to avoid N+1 queries
     */
    protected function getBaseUnit(): ?self
    {
        if ($this->relationLoaded('productVariant') && $this->productVariant->relationLoaded('packagingTypes')) {
            return $this->productVariant->packagingTypes->firstWhere('is_base_unit', true);
        }

        return $this->productVariant->packagingTypes()
            ->where('is_base_unit', true)
            ->first();
    }
}
