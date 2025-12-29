<?php

namespace App\Models;

use App\Enums\CatalogVisibility;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierCatalogItem extends Model
{
    use HasFactory;
    protected $fillable = [
        'supplier_tenant_id',
        'product_id',
        'is_available',
        'base_wholesale_price',
        'min_order_quantity',
        'visibility',
        'description',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'base_wholesale_price' => 'decimal:2',
        'min_order_quantity' => 'integer',
        'visibility' => CatalogVisibility::class,
    ];

    public function supplierTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'supplier_tenant_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function pricingTiers(): HasMany
    {
        return $this->hasMany(SupplierPricingTier::class, 'catalog_item_id');
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class, 'catalog_item_id');
    }

    public function getPriceForQuantity(int $quantity, ?int $connectionId = null): float
    {
        $tiersQuery = $this->pricingTiers()
            ->where('min_quantity', '<=', $quantity)
            ->where(function ($query) use ($quantity) {
                $query->whereNull('max_quantity')
                    ->orWhere('max_quantity', '>=', $quantity);
            })
            ->orderBy('min_quantity', 'desc');

        if ($connectionId) {
            $connectionSpecific = (clone $tiersQuery)
                ->where('connection_id', $connectionId)
                ->first();

            if ($connectionSpecific) {
                return (float) $connectionSpecific->price;
            }
        }

        $generalTier = $tiersQuery->whereNull('connection_id')->first();

        return $generalTier ? (float) $generalTier->price : (float) $this->base_wholesale_price;
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeForSupplier($query, $tenantId)
    {
        return $query->where('supplier_tenant_id', $tenantId);
    }

    public function scopeVisibleTo($query, $buyerTenantId)
    {
        return $query->where(function ($q) use ($buyerTenantId) {
            $q->where('visibility', CatalogVisibility::PUBLIC)
                ->orWhere(function ($subQ) use ($buyerTenantId) {
                    $subQ->where('visibility', CatalogVisibility::CONNECTIONS_ONLY)
                        ->whereHas('supplierTenant.supplierProfile.connections', function ($connQ) use ($buyerTenantId) {
                            $connQ->where('buyer_tenant_id', $buyerTenantId)
                                ->approved();
                        });
                });
        });
    }
}
