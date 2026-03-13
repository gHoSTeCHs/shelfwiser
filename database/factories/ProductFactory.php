<?php

namespace Database\Factories;

use App\Models\ProductType;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'shop_id' => Shop::factory(),
            'product_type_id' => fn (array $attributes) => ProductType::factory()->create(['tenant_id' => $attributes['tenant_id']])->id,
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->sentence(),
            'is_active' => true,
            'is_featured' => false,
            'has_variants' => false,
            'track_stock' => true,
            'is_taxable' => false,
            'display_order' => 0,
        ];
    }

    public function featured(): static
    {
        return $this->state(['is_featured' => true]);
    }
}
