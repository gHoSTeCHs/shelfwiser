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

    public function getTotalStockAttribute(): int
    {
        return $this->inventoryLocations()->sum('quantity');
    }

    public function getAvailableStockAttribute(): int
    {
        return $this->inventoryLocations()->sum(\DB::raw('quantity - reserved_quantity'));
    }
}
