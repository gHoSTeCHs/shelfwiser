<?php

namespace Database\Factories;

use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FundRequest>
 */
class FundRequestFactory extends Factory
{
    public function definition(): array
    {
        $tenant = Tenant::factory()->create();

        return [
            'user_id' => User::factory()->for($tenant),
            'shop_id' => fn (array $attrs) => Shop::factory()->create(['tenant_id' => $attrs['tenant_id']])->id,
            'tenant_id' => $tenant->id,
            'request_type' => FundRequestType::FUEL,
            'amount' => fake()->randomFloat(2, 1000, 50000),
            'description' => fake()->sentence(),
            'status' => FundRequestStatus::PENDING,
            'requested_at' => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => FundRequestStatus::PENDING]);
    }

    public function approved(): static
    {
        return $this->state(['status' => FundRequestStatus::APPROVED]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => FundRequestStatus::REJECTED]);
    }

    public function forShop(Shop $shop): static
    {
        return $this->state([
            'shop_id' => $shop->id,
            'tenant_id' => $shop->tenant_id,
        ]);
    }
}
