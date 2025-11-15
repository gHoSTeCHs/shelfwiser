<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'service_category_id',
        'name',
        'slug',
        'description',
        'image_url',
        'has_material_options',
        'is_active',
        'is_available_online',
    ];

    protected $casts = [
        'has_material_options' => 'boolean',
        'is_active' => 'boolean',
        'is_available_online' => 'boolean',
    ];

    /**
     * Get the tenant that owns this service
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the shop that owns this service
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the category for this service
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    /**
     * Get the service variants
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ServiceVariant::class);
    }

    /**
     * Get service-specific add-ons
     */
    public function addons(): HasMany
    {
        return $this->hasMany(ServiceAddon::class);
    }

    /**
     * Scope to only active services
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to only services available online
     */
    public function scopeAvailableOnline($query)
    {
        return $query->where('is_available_online', true);
    }
}
