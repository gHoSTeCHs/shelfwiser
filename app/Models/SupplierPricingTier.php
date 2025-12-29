<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierPricingTier extends Model
{
    use HasFactory;
    protected $fillable = [
        'catalog_item_id',
        'connection_id',
        'min_quantity',
        'max_quantity',
        'price',
    ];

    protected $casts = [
        'min_quantity' => 'integer',
        'max_quantity' => 'integer',
        'price' => 'decimal:2',
    ];

    public function catalogItem(): BelongsTo
    {
        return $this->belongsTo(SupplierCatalogItem::class, 'catalog_item_id');
    }

    public function connection(): BelongsTo
    {
        return $this->belongsTo(SupplierConnection::class);
    }

    public function scopeForConnection($query, $connectionId)
    {
        return $query->where('connection_id', $connectionId);
    }

    public function scopeGeneral($query)
    {
        return $query->whereNull('connection_id');
    }

    public function isApplicableForQuantity(int $quantity): bool
    {
        $meetsMin = $quantity >= $this->min_quantity;
        $meetsMax = is_null($this->max_quantity) || $quantity <= $this->max_quantity;

        return $meetsMin && $meetsMax;
    }
}
