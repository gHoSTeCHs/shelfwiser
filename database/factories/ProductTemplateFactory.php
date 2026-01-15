<?php

namespace Database\Factories;

use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductTemplate>
 */
class ProductTemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'product_type_id' => ProductType::factory(),
            'category_id' => ProductCategory::factory(),
            'created_by_id' => User::factory(),
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'custom_attributes' => null,
            'template_structure' => [
                'variants' => [
                    [
                        'name' => 'Standard',
                        'sku_suffix' => 'STD',
                    ],
                ],
            ],
            'images' => null,
            'seo_metadata' => null,
            'has_variants' => false,
            'is_system' => false,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the template is a system template.
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => null,
            'is_system' => true,
        ]);
    }

    /**
     * Indicate that the template has variants.
     */
    public function withVariants(): static
    {
        return $this->state(fn (array $attributes) => [
            'has_variants' => true,
            'template_structure' => [
                'variants' => [
                    [
                        'name' => 'Small',
                        'sku_suffix' => 'SM',
                        'attributes' => ['size' => 'small'],
                    ],
                    [
                        'name' => 'Medium',
                        'sku_suffix' => 'MD',
                        'attributes' => ['size' => 'medium'],
                    ],
                    [
                        'name' => 'Large',
                        'sku_suffix' => 'LG',
                        'attributes' => ['size' => 'large'],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Indicate that the template is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
