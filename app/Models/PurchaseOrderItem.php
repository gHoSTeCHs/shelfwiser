<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory;
    protected $fillable = [
        'purchase_order_id',
        'product_variant_id',
        'catalog_item_id',
        'quantity',
        'unit_price',
        'total_price',
        'received_quantity',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'received_quantity' => 'integer',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function catalogItem(): BelongsTo
    {
        return $this->belongsTo(SupplierCatalogItem::class, 'catalog_item_id');
    }

    public function calculateTotal(): void
    {
        $this->total_price = $this->quantity * $this->unit_price;
        $this->save();
    }

    public function isFullyReceived(): bool
    {
        return $this->received_quantity >= $this->quantity;
    }

    public function getRemainingQuantity(): int
    {
        return max(0, $this->quantity - $this->received_quantity);
    }
}
