<?php

namespace App\Models;

use App\Enums\InventoryModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id', 'shop_type_id', 'name', 'slug', 'config', 'inventory_model',
        'address', 'city', 'state', 'country', 'phone', 'email', 'is_active',
        'storefront_enabled', 'storefront_settings'
    ];

    protected $casts = [
        'config' => 'array',
        'storefront_settings' => 'array',
        'inventory_model' => InventoryModel::class,
        'is_active' => 'boolean',
        'storefront_enabled' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(ShopType::class, 'shop_type_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the carts for the shop.
     */
    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }
}
