<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class ShopType extends Model
{
    use HasFactory;

    protected $casts = [
        'config_schema' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(fn ($type) => static::clearCache($type->tenant_id));
        static::deleted(fn ($type) => static::clearCache($type->tenant_id));
    }

    private static function clearCache(?int $tenantId): void
    {
        $tags = $tenantId ? ["tenant:{$tenantId}:shop_types"] : ['system:shop_types'];
        Cache::tags($tags)->flush();
    }

    public function scopeAccessibleTo($query, ?int $tenantId)
    {
        return $query->where(fn ($q) => $q
            ->whereNull('tenant_id')
            ->orWhere('tenant_id', $tenantId)
        );
    }

    public function shops(): HasMany
    {
        return $this->hasMany(Shop::class);
    }
}
