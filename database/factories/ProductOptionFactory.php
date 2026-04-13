<?php

namespace Database\Factories;

use App\Enums\OptionVisualType;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductOption>
 */
class ProductOptionFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->randomElement(['size', 'color', 'material', 'style', 'finish']);

        return [
            'product_id' => Product::factory(),
            'tenant_id' => fn (array $attributes) => Product::query()->find($attributes['product_id'])?->tenant_id
                ?? Tenant::factory()->create()->id,
            'name' => $name,
            'display_name' => ucfirst($name),
            'position' => fake()->numberBetween(1, 10),
            'visual_type' => OptionVisualType::DROPDOWN,
        ];
    }
}
