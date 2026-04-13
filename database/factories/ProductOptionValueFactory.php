<?php

namespace Database\Factories;

use App\Models\ProductOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductOptionValue>
 */
class ProductOptionValueFactory extends Factory
{
    public function definition(): array
    {
        $label = fake()->unique()->word();

        return [
            'product_option_id' => ProductOption::factory(),
            'label' => ucfirst($label),
            'value' => strtolower($label),
            'position' => fake()->numberBetween(1, 10),
            'visual_data' => null,
        ];
    }
}
