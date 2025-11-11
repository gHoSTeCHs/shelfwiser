<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class ProductType extends Model
{
    use HasFactory;

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
        static::saved(fn($type) => static::clearCache($type->tenant_id));
        static::deleted(fn($type) => static::clearCache($type->tenant_id));
    }

    private static function clearCache(?int $tenantId): void
    {
        $tags = $tenantId ? ["tenant:{$tenantId}:product_types"] : ['system:product_types'];
        Cache::tags($tags)->flush();
    }

    public function scopeAccessibleTo($query, ?int $tenantId)
    {
        return $query->where(fn($q) => $q
            ->whereNull('tenant_id')
            ->orWhere('tenant_id', $tenantId)
        );
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
