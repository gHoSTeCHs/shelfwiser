<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\ServiceVariant;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'tenant_id' => Tenant::factory(),
            'quantity' => $this->faker->numberBetween(1, 10),
            'unit_price' => $this->faker->randomFloat(2, 10, 1000),
            'discount_amount' => 0,
            'tax_amount' => 0,
            'total_amount' => 0,
        ];
    }

    public function forProduct(?ProductVariant $variant = null): static
    {
        return $this->state(function (array $attributes) use ($variant) {
            $productVariant = $variant ?? ProductVariant::factory()->create();
            $quantity = $attributes['quantity'] ?? 1;
            $unitPrice = $productVariant->price;
            $subtotal = $unitPrice * $quantity;

            return [
                'product_variant_id' => $productVariant->id,
                'sellable_type' => ProductVariant::class,
                'sellable_id' => $productVariant->id,
                'unit_price' => $unitPrice,
                'total_amount' => $subtotal + ($attributes['tax_amount'] ?? 0) - ($attributes['discount_amount'] ?? 0),
                'metadata' => null,
            ];
        });
    }

    public function forService(?ServiceVariant $variant = null, ?array $metadata = null): static
    {
        return $this->state(function (array $attributes) use ($variant, $metadata) {
            $serviceVariant = $variant ?? ServiceVariant::factory()->create();
            $quantity = $attributes['quantity'] ?? 1;
            $unitPrice = $serviceVariant->base_price ?? $this->faker->randomFloat(2, 50, 500);
            $subtotal = $unitPrice * $quantity;

            return [
                'product_variant_id' => null,
                'sellable_type' => ServiceVariant::class,
                'sellable_id' => $serviceVariant->id,
                'unit_price' => $unitPrice,
                'total_amount' => $subtotal + ($attributes['tax_amount'] ?? 0) - ($attributes['discount_amount'] ?? 0),
                'metadata' => $metadata ?? [
                    'material_option' => 'none',
                    'selected_addons' => [],
                ],
                'quantity' => 1,
            ];
        });
    }
}
