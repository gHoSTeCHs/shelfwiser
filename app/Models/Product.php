<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Product Model
 *
 * Represents a product in the inventory system. Products can have multiple variants
 * (e.g., different sizes, colors) or be standalone items.
 *
 * STATE MANAGEMENT - is_active vs Soft Deletes:
 *
 * This model uses BOTH is_active flag AND soft deletes for different purposes:
 *
 * | State    | is_active | deleted_at | Behavior                                                    |
 * |----------|-----------|------------|-------------------------------------------------------------|
 * | Active   | true      | null       | Fully visible: POS, Storefront, Admin, Reports             |
 * | Inactive | false     | null       | Hidden from POS/Storefront, still visible in Admin/Reports |
 * | Deleted  | N/A       | timestamp  | Completely hidden, can be restored via soft delete recovery|
 *
 * When to use is_active = false:
 * - Temporarily disable sales (out of season, pending restock)
 * - Hide from customer-facing channels without losing data
 * - Maintain in reports and historical data
 * - Quick toggle for product availability
 *
 * When to use soft delete (deleted_at):
 * - Permanently remove from all active operations
 * - Discontinue product while preserving historical order data
 * - Complete removal from POS, Storefront, and Admin views
 * - Can be restored if deleted by mistake
 *
 * Example Scenarios:
 * - Seasonal item (winter coat in summer): Set is_active = false
 * - Out of stock temporarily: Set is_active = false
 * - Product line discontinued: Soft delete (preserves historical sales)
 * - Accidental deletion: Restore from soft delete
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $shop_id
 * @property int|null $template_id
 * @property int $product_type_id
 * @property int|null $category_id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property array|null $custom_attributes
 * @property bool $has_variants
 * @property bool $is_active
 * @property bool $track_stock
 * @property bool $is_taxable
 * @property bool $is_featured
 * @property int|null $display_order
 * @property string|null $seo_title
 * @property string|null $seo_description
 * @property string|null $seo_keywords
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Product extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'template_id',
        'product_type_id',
        'category_id',
        'name',
        'slug',
        'description',
        'custom_attributes',
        'has_variants',
        'is_active',
        'track_stock',
        'is_taxable',
        'is_featured',
        'display_order',
        'seo_title',
        'seo_description',
        'seo_keywords',
    ];

    protected $casts = [
        'custom_attributes' => 'array',
        'has_variants' => 'boolean',
        'is_active' => 'boolean',
        'track_stock' => 'boolean',
        'is_taxable' => 'boolean',
        'is_featured' => 'boolean',
        'display_order' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ProductTemplate::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(ProductType::class, 'product_type_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get all images for this product
     */
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function supplierCatalogItem(): HasOne
    {
        return $this->hasOne(SupplierCatalogItem::class);
    }

    /**
     * Scope a query to only include active products.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
