<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ProductTemplate extends Model
{
    use HasFactory, SoftDeletes;

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

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'template_id');
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailableFor($query, ?int $tenantId)
    {
        return $query->where(function ($q) use ($tenantId) {
            $q->where('is_system', true)
                ->orWhere('tenant_id', $tenantId);
        });
    }

    public function isSystemTemplate(): bool
    {
        return $this->is_system && $this->tenant_id === null;
    }

    public function getVariantCountAttribute(): int
    {
        return count($this->template_structure['variants'] ?? []);
    }

    public function getUsageCountAttribute(): int
    {
        return $this->products()->count();
    }
}
