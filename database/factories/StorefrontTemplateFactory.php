<?php

namespace Database\Factories;

use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontTemplateCategory;
use App\Models\StorefrontTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorefrontTemplate>
 */
class StorefrontTemplateFactory extends Factory
{
    protected $model = StorefrontTemplate::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true) . ' Template',
            'slug' => fake()->unique()->slug(),
            'description' => fake()->sentence(),
            'category' => StorefrontTemplateCategory::COMMERCE,
            'structural_config' => [
                'layout' => 'standard',
                'max_sections_per_page' => 20,
            ],
            'animation_tier' => StorefrontAnimationTier::SUBTLE,
            'supported_sections' => ['hero_banner', 'featured_products', 'product_grid', 'rich_text'],
            'supported_pages' => ['home', 'products', 'product_detail', 'cart', 'checkout', 'about', 'contact'],
            'navigation_pattern' => 'standard',
            'scroll_behavior' => 'standard',
            'is_premium' => false,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function premium(): static
    {
        return $this->state(['is_premium' => true]);
    }
}
