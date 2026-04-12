<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'slug' => fake()->unique()->slug(),
            'owner_email' => fake()->unique()->safeEmail(),
            'business_type' => fake()->randomElement(['retail', 'wholesale', 'services']),
            'phone' => fake()->phoneNumber(),
            'is_active' => true,
            'subscription_plan' => 'standard',
            'max_shops' => 5,
            'max_users' => 20,
            'max_products' => 500,
        ];
    }
}
