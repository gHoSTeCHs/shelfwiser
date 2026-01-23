<?php

namespace Database\Factories;

use App\Enums\MaterialOption;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\ServiceVariant;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class CartItemFactory extends Factory
{
    protected $model = CartItem::class;

    public function definition(): array
    {
        return [
            'cart_id' => Cart::factory(),
            'tenant_id' => Tenant::factory(),
            'quantity' => $this->faker->numberBetween(1, 10),
            'price' => $this->faker->randomFloat(2, 10, 1000),
        ];
    }

    public function forProduct(?ProductVariant $variant = null): static
    {
        return $this->state(function (array $attributes) use ($variant) {
            $productVariant = $variant ?? ProductVariant::factory()->create();

            return [
                'product_variant_id' => $productVariant->id,
                'sellable_type' => ProductVariant::class,
                'sellable_id' => $productVariant->id,
                'price' => $productVariant->price,
                'material_option' => null,
                'selected_addons' => null,
                'base_price' => null,
            ];
        });
    }

    public function forService(?ServiceVariant $variant = null, ?string $materialOption = null, ?array $addons = null): static
    {
        return $this->state(function (array $attributes) use ($variant, $materialOption, $addons) {
            $serviceVariant = $variant ?? ServiceVariant::factory()->create();
            $basePrice = $serviceVariant->base_price ?? $this->faker->randomFloat(2, 50, 500);
            $addonCost = $addons ? array_sum(array_column($addons, 'price')) : 0;

            return [
                'product_variant_id' => null,
                'sellable_type' => ServiceVariant::class,
                'sellable_id' => $serviceVariant->id,
                'material_option' => $materialOption ? MaterialOption::from($materialOption) : MaterialOption::NONE,
                'selected_addons' => $addons,
                'base_price' => $basePrice,
                'price' => $basePrice + $addonCost,
                'quantity' => 1,
            ];
        });
    }
}
