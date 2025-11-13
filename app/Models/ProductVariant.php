<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
    ];

    protected $casts = [
        'attributes' => 'array',
        'images' => 'array',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'expiry_date' => 'date',
        'is_active' => 'boolean',
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

    public function getTotalStockAttribute(): int
    {
        return $this->inventoryLocations()->sum('quantity');
    }

    public function getAvailableStockAttribute(): int
    {
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
