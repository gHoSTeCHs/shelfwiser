<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->word(),
            'sku' => fake()->unique()->bothify('SKU-####-??'),
            'price' => fake()->randomFloat(2, 100, 50000),
            'cost_price' => fake()->randomFloat(2, 50, 25000),
            'is_active' => true,
            'is_available_online' => true,
        ];
    }
}
