<?php

namespace Database\Factories;

use App\Enums\InventoryModel;
use App\Models\ShopType;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shop>
 */
class ShopFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'shop_type_id' => fn (array $attributes) => ShopType::factory()->create(['tenant_id' => $attributes['tenant_id']])->id,
            'name' => fake()->company().' Store',
            'slug' => fake()->unique()->slug(),
            'config' => [],
            'inventory_model' => InventoryModel::SIMPLE_RETAIL,
            'is_active' => true,
            'storefront_enabled' => false,
            'currency' => 'NGN',
            'currency_symbol' => '₦',
            'currency_decimals' => 2,
            'vat_enabled' => false,
            'vat_rate' => 0,
            'vat_inclusive' => false,
        ];
    }

    public function withStorefront(): static
    {
        return $this->state(['storefront_enabled' => true]);
    }
}
