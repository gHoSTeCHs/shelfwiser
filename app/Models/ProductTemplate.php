<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ProductTemplate extends Model
{
//    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'product_type_id',
        'category_id',
        'created_by_id',
        'name',
        'slug',
        'description',
        'custom_attributes',
        'template_structure',
        'images',
        'seo_metadata',
        'has_variants',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'custom_attributes' => 'array',
        'template_structure' => 'array',
        'images' => 'array',
        'seo_metadata' => 'array',
        'has_variants' => 'boolean',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (ProductTemplate $template) {
            if (empty($template->slug)) {
                $template->slug = Str::slug($template->name);
            }
        });
    }

    /**
     * Get the tenant that owns the template.
     * Null for system templates.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the product type for this template.
     */
    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class);
    }

    /**
     * Get the category for this template.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * Get the user who created this template.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * Get products created from this template.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'template_id');
    }

    /**
     * Scope to get system templates.
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to get active templates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get templates available for a tenant.
     * Includes system templates and tenant's own templates.
     */
    public function scopeAvailableFor($query, ?int $tenantId)
    {
        return $query->where(function ($q) use ($tenantId) {
            $q->where('is_system', true)
                ->orWhere('tenant_id', $tenantId);
        });
    }

    /**
     * Check if template is a system template.
     */
    public function isSystemTemplate(): bool
    {
        return $this->is_system && $this->tenant_id === null;
    }

    /**
     * Get the variant count from template structure.
     */
    public function getVariantCountAttribute(): int
    {
        return count($this->template_structure['variants'] ?? []);
    }

    /**
     * Get usage count (products created from this template).
     */
    public function getUsageCountAttribute(): int
    {
        return $this->products()->count();
    }
}
