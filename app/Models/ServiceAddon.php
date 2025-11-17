<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceAddon extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'service_category_id',
        'name',
        'description',
        'price',
        'allows_quantity',
        'max_quantity',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'allows_quantity' => 'boolean',
        'max_quantity' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the service this addon belongs to (if service-specific)
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the category this addon belongs to (if category-wide)
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    /**
     * Check if addon is service-specific
     */
    public function isServiceSpecific(): bool
    {
        return !is_null($this->service_id);
    }

    /**
     * Check if addon is category-wide
     */
    public function isCategoryWide(): bool
    {
        return !is_null($this->service_category_id) && is_null($this->service_id);
    }

    /**
     * Scope to only active addons
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to service-specific addons
     */
    public function scopeForService($query, int $serviceId)
    {
        return $query->where('service_id', $serviceId);
    }

    /**
     * Scope to category-wide addons
     */
    public function scopeForCategory($query, int $categoryId)
    {
        return $query->where('service_category_id', $categoryId)
                     ->whereNull('service_id');
    }
}
