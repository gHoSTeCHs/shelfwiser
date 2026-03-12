<?php

namespace App\Models;

use App\Enums\StorefrontPageType;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorefrontPage extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'storefront_config_id',
        'page_type',
        'slug',
        'title',
        'sections',
        'seo_title',
        'seo_description',
        'seo_image_path',
        'is_published',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'page_type' => StorefrontPageType::class,
            'sections' => 'array',
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function storefrontConfig(): BelongsTo
    {
        return $this->belongsTo(StorefrontConfig::class, 'storefront_config_id');
    }
}
