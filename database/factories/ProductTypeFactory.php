<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductType>
 */
class ProductTypeFactory extends Factory
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
            'slug' => fake()->unique()->slug(),
            'label' => fake()->words(2, true),
            'description' => fake()->sentence(),
            'config_schema' => null,
            'supports_variants' => false,
            'requires_batch_tracking' => false,
            'requires_serial_tracking' => false,
            'is_active' => true,
        ];
    }
}
