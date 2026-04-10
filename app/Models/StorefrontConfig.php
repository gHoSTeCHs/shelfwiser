<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StorefrontConfig extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'theme_id',
        'color_preset',
        'color_overrides',
        'color_preset_dark',
        'color_overrides_dark',
        'dark_mode_enabled',
        'dark_mode_strategy',
        'typography_preset',
        'typography_overrides',
        'component_overrides',
        'feel_overrides',
        'animation_overrides',
        'header_overrides',
        'footer_overrides',
        'logo_path',
        'favicon_path',
        'social_links',
        'global_announcement',
        'custom_css',
        'seo_defaults',
        'is_published',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'color_overrides' => 'array',
            'color_overrides_dark' => 'array',
            'dark_mode_enabled' => 'boolean',
            'typography_overrides' => 'array',
            'component_overrides' => 'array',
            'feel_overrides' => 'array',
            'animation_overrides' => 'array',
            'header_overrides' => 'array',
            'footer_overrides' => 'array',
            'social_links' => 'array',
            'global_announcement' => 'array',
            'seo_defaults' => 'array',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
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

    public function theme(): BelongsTo
    {
        return $this->belongsTo(StorefrontTheme::class, 'theme_id');
    }

    public function pages(): HasMany
    {
        return $this->hasMany(StorefrontPage::class, 'storefront_config_id');
    }
}
