<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'preferred_shop_id' => fn (array $attributes) => Shop::factory()->create(['tenant_id' => $attributes['tenant_id']])->id,
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'password' => static::$password ??= Hash::make('password'),
            'is_active' => true,
            'marketing_opt_in' => false,
            'account_balance' => 0,
            'credit_limit' => null,
            'total_purchases' => 0,
        ];
    }
}
