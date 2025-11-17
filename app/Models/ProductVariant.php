<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ProductVariant extends Model
{
    use HasFactory;

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
        $currentQty = $this->total_stock;
        $currentCost = (float) $this->cost_price;

        if ($currentQty + $newQuantity <= 0) {
            return;
        }

        $newAvg = (($currentQty * $currentCost) + ($newQuantity * $newCostPerUnit))
                  / ($currentQty + $newQuantity);

        $this->update(['cost_price' => round($newAvg, 2)]);
    }

    /**
     * Get cost for a specific packaging type
     */
    public function getCostForPackage(ProductPackagingType $package): float
    {
        return ((float) $this->cost_price) * $package->units_per_package;
    }
}
