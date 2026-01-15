<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

/**
 * ProductType Model - System-Managed Product Type Definitions
 *
 * This model represents predefined product type templates that define the structure,
 * behavior, and tracking requirements for different categories of products.
 *
 * IMPORTANT: ProductTypes are SYSTEM-MANAGED and should NOT be created, updated, or
 * deleted through user interfaces. They are seeded via ProductTypeSeeder and define
 * core business logic for product behavior.
 *
 * System vs Tenant-Specific Types:
 * - tenant_id = NULL: System-wide types (pharmaceutical, electronics, etc.) accessible to all tenants
 * - tenant_id = {id}: Reserved for future tenant-specific custom types (not currently implemented)
 *
 * ProductType determines:
 * - Whether variants are supported (supports_variants)
 * - Batch number tracking requirements (requires_batch_tracking)
 * - Serial number tracking requirements (requires_serial_tracking)
 * - Dynamic configuration schema for custom attributes (config_schema)
 *
 * Related Models:
 * - Product: Each product belongs to one ProductType
 * - ProductTemplate: Templates are associated with ProductTypes
 *
 * @property int $id
 * @property int|null $tenant_id
 * @property string $slug
 * @property string $label
 * @property string|null $description
 * @property array|null $config_schema
 * @property bool $supports_variants
 * @property bool $requires_batch_tracking
 * @property bool $requires_serial_tracking
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class ProductType extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'slug',
        'label',
        'description',
        'config_schema',
        'supports_variants',
        'requires_batch_tracking',
        'requires_serial_tracking',
        'is_active',
    ];

    protected $casts = [
        'config_schema' => 'array',
        'supports_variants' => 'boolean',
        'requires_batch_tracking' => 'boolean',
        'requires_serial_tracking' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(fn ($type) => static::clearCache($type->tenant_id));
        static::deleted(fn ($type) => static::clearCache($type->tenant_id));
    }

    private static function clearCache(?int $tenantId): void
    {
        $tags = $tenantId ? ["tenant:{$tenantId}:product_types"] : ['system:product_types'];
        Cache::tags($tags)->flush();
    }

    public function scopeAccessibleTo($query, ?int $tenantId)
    {
        return $query->where(fn ($q) => $q
            ->whereNull('tenant_id')
            ->orWhere('tenant_id', $tenantId)
        );
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
