<?php

namespace App\Models;

use App\Enums\MaterialOption;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'service_id',
        'name',
        'description',
        'customer_materials_price',
        'shop_materials_price',
        'base_price',
        'estimated_duration_minutes',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'customer_materials_price' => 'decimal:2',
        'shop_materials_price' => 'decimal:2',
        'base_price' => 'decimal:2',
        'estimated_duration_minutes' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the service this variant belongs to
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get cart items for this variant
     */
    public function cartItems(): MorphMany
    {
        return $this->morphMany(CartItem::class, 'sellable');
    }

    /**
     * Get order items for this variant
     */
    public function orderItems(): MorphMany
    {
        return $this->morphMany(OrderItem::class, 'sellable');
    }

    /**
     * Get the price based on material option
     */
    public function getPriceForMaterialOption(?MaterialOption $option): float
    {
        if (! $this->service->has_material_options || $option === MaterialOption::NONE) {
            return (float) $this->base_price;
        }

        return match ($option) {
            MaterialOption::CUSTOMER_MATERIALS => (float) ($this->customer_materials_price ?? $this->base_price),
            MaterialOption::SHOP_MATERIALS => (float) ($this->shop_materials_price ?? $this->base_price),
            default => (float) $this->base_price,
        };
    }

    /**
     * Calculate total price with add-ons
     */
    public function calculateTotalPrice(?MaterialOption $materialOption, array $selectedAddons = []): float
    {
        $basePrice = $this->getPriceForMaterialOption($materialOption);
        $addonsTotal = 0;

        foreach ($selectedAddons as $addon) {
            if (isset($addon['addon_id']) && isset($addon['quantity'])) {
                $serviceAddon = ServiceAddon::find($addon['addon_id']);
                if ($serviceAddon) {
                    $addonsTotal += $serviceAddon->price * $addon['quantity'];
                }
            }
        }

        return $basePrice + $addonsTotal;
    }

    /**
     * Scope to only active variants
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
