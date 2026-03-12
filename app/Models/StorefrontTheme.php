<?php

namespace App\Models;

use App\Enums\StorefrontThemeCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StorefrontTheme extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'name',
        'slug',
        'description',
        'category',
        'thumbnail_path',
        'ideal_for',
        'theme_config',
        'default_sections',
        'is_premium',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'category' => StorefrontThemeCategory::class,
            'theme_config' => 'array',
            'default_sections' => 'array',
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(StorefrontTemplate::class, 'template_id');
    }

    public function shopConfigs(): HasMany
    {
        return $this->hasMany(StorefrontConfig::class, 'theme_id');
    }
}
