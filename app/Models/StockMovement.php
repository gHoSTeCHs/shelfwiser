<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'product_variant_id',
        'product_packaging_type_id',
        'from_location_id',
        'to_location_id',
        'purchase_order_id',
        'type',
        'quantity',
        'package_quantity',
        'cost_per_package',
        'cost_per_base_unit',
        'quantity_before',
        'quantity_after',
        'reference_number',
        'reason',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'type' => StockMovementType::class,
        'quantity' => 'integer',
        'package_quantity' => 'integer',
        'cost_per_package' => 'decimal:2',
        'cost_per_base_unit' => 'decimal:2',
        'quantity_before' => 'integer',
        'quantity_after' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'from_location_id');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'to_location_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function packagingType(): BelongsTo
    {
        return $this->belongsTo(ProductPackagingType::class, 'product_packaging_type_id');
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get a human-readable description of the movement with packaging context
     */
    public function getPackageDescriptionAttribute(): string
    {
        if (! $this->product_packaging_type_id || ! $this->package_quantity) {
            return "{$this->quantity} {$this->productVariant->base_unit_name}(s)";
        }

        $packagingName = $this->packagingType->display_name ?? $this->packagingType->name;
        $baseUnits = $this->productVariant->base_unit_name;

        return "{$this->package_quantity} {$packagingName}(s) ({$this->quantity} {$baseUnits}(s))";
    }

    /**
     * Get total cost for purchase movements
     */
    public function getTotalCostAttribute(): ?float
    {
        if ($this->type !== StockMovementType::PURCHASE) {
            return null;
        }

        if ($this->cost_per_package && $this->package_quantity) {
            return $this->cost_per_package * $this->package_quantity;
        }

        if ($this->cost_per_base_unit && $this->quantity) {
            return $this->cost_per_base_unit * abs($this->quantity);
        }

        return null;
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForShop($query, int $shopId)
    {
        return $query->where('shop_id', $shopId);
    }

    public function scopeForVariant($query, int $variantId)
    {
        return $query->where('product_variant_id', $variantId);
    }

    public function scopeOfType($query, StockMovementType $type)
    {
        return $query->where('type', $type);
    }
}
