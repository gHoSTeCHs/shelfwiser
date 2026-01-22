<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ProductVariant Model
 *
 * Represents a specific variant of a product (e.g., Blue Shirt - Size M, 500mg Tablet - Box of 20).
 * Each variant has its own SKU, pricing, inventory, and tracking information.
 *
 * STATE MANAGEMENT - is_active vs Soft Deletes:
 *
 * This model uses BOTH is_active flag AND soft deletes for granular inventory control:
 *
 * | State    | is_active | deleted_at | Behavior                                                    |
 * |----------|-----------|------------|-------------------------------------------------------------|
 * | Active   | true      | null       | Fully available: POS, Storefront, Admin, Stock tracking    |
 * | Inactive | false     | null       | Hidden from sales, visible in Admin, inventory still tracked|
 * | Deleted  | N/A       | timestamp  | Removed from all views, inventory frozen, can be restored   |
 *
 * When to use is_active = false:
 * - Temporarily suspend sales of this specific variant
 * - Variant out of stock but may return (e.g., seasonal size)
 * - Testing new variant before public release
 * - Hiding variant from storefront while keeping in POS for returns/exchanges
 * - Inventory still tracked and visible in admin
 *
 * When to use soft delete (deleted_at):
 * - Permanently discontinue this variant
 * - Variant will never be restocked (e.g., color discontinued)
 * - Complete removal from sales channels and admin UI
 * - Inventory frozen at deletion time for historical accuracy
 * - Preserves data for past orders and reports
 *
 * Example Scenarios:
 * - Size XS out of stock: Set is_active = false (may restock)
 * - Color "Salmon Pink" discontinued: Soft delete (never returning)
 * - Batch recalled for quality issue: Set is_active = false
 * - SKU restructuring (old SKU replaced): Soft delete old, create new
 * - Variant created by mistake: Soft delete (can restore if needed)
 *
 * Additional Considerations:
 * - is_available_online: Controls online storefront visibility specifically
 * - Soft deleted variants still appear in historical order data
 * - Stock movements stop when variant is deleted
 * - Cost price and inventory levels are preserved after soft delete
 *
 * @property int $id
 * @property int $product_id
 * @property string|null $sku
 * @property string|null $barcode
 * @property string|null $name
 * @property array|null $attributes
 * @property float $price
 * @property float|null $cost_price
 * @property int|null $reorder_level
 * @property string|null $base_unit_name
 * @property string|null $image_url
 * @property array|null $images
 * @property string|null $batch_number
 * @property \Illuminate\Support\Carbon|null $expiry_date
 * @property string|null $serial_number
 * @property bool $is_active
 * @property bool $is_available_online
 * @property int|null $max_order_quantity
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'name',
        'attributes',
        'price',
        'cost_price',
        'reorder_level',
        'base_unit_name',
        'image_url',
        'images',
        'batch_number',
        'expiry_date',
        'serial_number',
        'is_active',
        'is_available_online',
        'max_order_quantity',
    ];

    protected $casts = [
        'attributes' => 'array',
        'images' => 'array',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'expiry_date' => 'date',
        'is_active' => 'boolean',
        'is_available_online' => 'boolean',
        'max_order_quantity' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function inventoryLocations(): HasMany
    {
        return $this->hasMany(InventoryLocation::class);
    }

    public function packagingTypes(): HasMany
    {
        return $this->hasMany(ProductPackagingType::class)
            ->orderBy('display_order');
    }

    /**
     * Get all images for this product variant
     */
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    /**
     * Get total stock across all locations
     * Note: Use eager loading with 'inventoryLocations' to avoid N+1 queries
     */
    public function getTotalStockAttribute(): int
    {
        if ($this->relationLoaded('inventoryLocations')) {
            return $this->inventoryLocations->sum('quantity');
        }

        return $this->inventoryLocations()->sum('quantity');
    }

    /**
     * Get available stock (total - reserved) across all locations
     * Note: Use eager loading with 'inventoryLocations' to avoid N+1 queries
     */
    public function getAvailableStockAttribute(): int
    {
        if ($this->relationLoaded('inventoryLocations')) {
            return $this->inventoryLocations->sum(fn($loc) => $loc->quantity - $loc->reserved_quantity);
        }

        return $this->inventoryLocations()->sum(\DB::raw('quantity - reserved_quantity'));
    }

    /**
     * Update cost price using weighted average method
     */
    public function updateWeightedAverageCost(int $newQuantity, float $newCostPerUnit): void
    {
        \DB::transaction(function () use ($newQuantity, $newCostPerUnit) {
            $variant = self::lockForUpdate()->find($this->id);

            if (!$variant) {
                return;
            }

            $currentQty = $variant->total_stock;
            $currentCost = (float) $variant->cost_price;

            if ($currentQty + $newQuantity <= 0) {
                return;
            }

            $newAvg = (($currentQty * $currentCost) + ($newQuantity * $newCostPerUnit))
                / ($currentQty + $newQuantity);

            $variant->update(['cost_price' => round($newAvg, 2)]);
        });
    }

    /**
     * Get cost for a specific packaging type
     */
    public function getCostForPackage(ProductPackagingType $package): float
    {
        return ((float) $this->cost_price) * $package->units_per_package;
    }

    /**
     * Scope a query to only include active product variants.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
