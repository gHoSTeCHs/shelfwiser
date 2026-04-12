<?php

namespace App\Models;

use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontTemplateCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StorefrontTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'structural_config',
        'animation_tier',
        'supported_sections',
        'supported_pages',
        'navigation_pattern',
        'scroll_behavior',
        'is_premium',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'category' => StorefrontTemplateCategory::class,
            'animation_tier' => StorefrontAnimationTier::class,
            'structural_config' => 'array',
            'supported_sections' => 'array',
            'supported_pages' => 'array',
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function themes(): HasMany
    {
        return $this->hasMany(StorefrontTheme::class, 'template_id');
    }
}
