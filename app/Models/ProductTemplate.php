<?php

namespace App\Models;

use App\Casts\TemplateStructureCast;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * ProductTemplate Model
 *
 * System-managed templates for streamlined product creation. Templates encapsulate
 * predefined product structures, attributes, and variant configurations to ensure
 * consistency across products of the same type within a tenant or system-wide.
 *
 * IMPORTANT: ProductTemplates are intentionally NOT user-editable via the UI.
 * Templates are managed exclusively through:
 * - System administration (seeding, migrations, artisan commands)
 * - Programmatic APIs for internal/admin use only (ProductTemplateController)
 *
 * Usage in Product Creation:
 * When users create products, they select a ProductTemplate which provides:
 * 1. Predefined variant structure (SKU patterns, barcode formats, etc.)
 * 2. Custom attributes specific to the product type (e.g., dimensions for clothing)
 * 3. Images and branding assets
 * 4. SEO metadata templates
 *
 * Template Scope & Availability:
 * - System Templates: tenant_id = NULL (available to all tenants)
 * - Tenant Templates: tenant_id = specific tenant (available only to that tenant)
 * Use the `availableFor($tenantId)` scope to fetch templates accessible to a tenant.
 *
 * Relationships:
 * - Tenant: The owning tenant (NULL for system-wide templates)
 * - ProductType: The product type this template applies to
 * - Category: Optional product category (for better organization)
 * - CreatedBy: The admin/system user who created the template
 * - Products: All products created from this template
 *
 * Template Structure:
 * The `template_structure` column (cast via TemplateStructureCast) contains:
 * - Variant definitions with SKU patterns, pricing rules, packaging types
 * - Custom field definitions for products using this template
 * - Default values and validation rules
 *
 * @property int $id
 * @property ?int $tenant_id
 * @property int $product_type_id
 * @property ?int $category_id
 * @property ?int $created_by_id
 * @property string $name
 * @property string $slug
 * @property ?string $description
 * @property array $custom_attributes
 * @property array $template_structure
 * @property array $images
 * @property array $seo_metadata
 * @property bool $has_variants
 * @property bool $is_system
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property ?\Illuminate\Support\Carbon $deleted_at
 */
class ProductTemplate extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

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
        'template_structure' => TemplateStructureCast::class,
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
