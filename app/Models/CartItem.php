<?php

namespace App\Models;

use App\Enums\MaterialOption;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CartItem extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'cart_id',
        'tenant_id',
        'product_variant_id',
        'product_packaging_type_id',
        'sellable_type',
        'sellable_id',
        'quantity',
        'price',
        'material_option',
        'selected_addons',
        'base_price',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'base_price' => 'decimal:2',
        'selected_addons' => 'array',
        'material_option' => MaterialOption::class,
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function sellable(): MorphTo
    {
        return $this->morphTo();
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function packagingType(): BelongsTo
    {
        return $this->belongsTo(ProductPackagingType::class, 'product_packaging_type_id');
    }

    public function isProduct(): bool
    {
        return $this->sellable_type === ProductVariant::class;
    }

    public function isService(): bool
    {
        return $this->sellable_type === ServiceVariant::class;
    }

    public function getSubtotalAttribute(): float
    {
        return $this->price * $this->quantity;
    }
}
