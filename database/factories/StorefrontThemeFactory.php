<?php

namespace Database\Factories;

use App\Enums\StorefrontThemeCategory;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorefrontTheme>
 */
class StorefrontThemeFactory extends Factory
{
    protected $model = StorefrontTheme::class;

    public function definition(): array
    {
        return [
            'template_id' => StorefrontTemplate::factory(),
            'name' => fake()->words(2, true) . ' Theme',
            'slug' => fake()->unique()->slug(),
            'description' => fake()->sentence(),
            'category' => StorefrontThemeCategory::GENERAL,
            'thumbnail_path' => null,
            'ideal_for' => fake()->sentence(4),
            'theme_config' => [
                'colors' => [
                    'primary' => '#2563eb',
                    'secondary' => '#64748b',
                    'accent' => '#f59e0b',
                    'background' => '#ffffff',
                    'foreground' => '#0f172a',
                ],
                'typography' => [
                    'heading_font' => 'Inter',
                    'body_font' => 'Inter',
                ],
                'border_radius' => 'md',
            ],
            'default_sections' => [],
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
