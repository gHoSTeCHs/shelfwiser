<?php

namespace App\Models;

use App\Enums\InventoryModel;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shop extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'shop_type_id', 'name', 'slug', 'config', 'inventory_model',
        'address', 'city', 'state', 'country', 'phone', 'email', 'is_active',
        'storefront_enabled', 'storefront_settings', 'allow_retail_sales',
        'shop_offering_type',
        'currency', 'currency_symbol', 'currency_decimals',
        'vat_enabled', 'vat_rate', 'vat_inclusive',
    ];

    protected $casts = [
        'config' => 'array',
        'storefront_settings' => 'array',
        'inventory_model' => InventoryModel::class,
        'is_active' => 'boolean',
        'storefront_enabled' => 'boolean',
        'allow_retail_sales' => 'boolean',
        'vat_enabled' => 'boolean',
        'vat_inclusive' => 'boolean',
        'currency_decimals' => 'integer',
        'vat_rate' => 'decimal:2',
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
        return $this->belongsToMany(User::class, 'shop_user')
            ->using(ShopUser::class)
            ->withPivot('tenant_id')
            ->withTimestamps();
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the services for the shop
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    /**
     * Get the carts for the shop
     */
    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }

    public function taxSettings(): HasOne
    {
        return $this->hasOne(ShopTaxSetting::class);
    }
}
