<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\StorefrontMedia;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorefrontMedia>
 */
class StorefrontMediaFactory extends Factory
{
    protected $model = StorefrontMedia::class;

    public function definition(): array
    {
        $tenant = Tenant::factory()->create();

        return [
            'tenant_id' => $tenant->id,
            'shop_id' => Shop::factory()->state(['tenant_id' => $tenant->id]),
            'file_path' => 'storefront/media/'.fake()->uuid().'.jpg',
            'file_name' => fake()->word().'.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => fake()->numberBetween(10000, 5000000),
            'dimensions' => ['width' => 1200, 'height' => 800],
            'alt_text' => fake()->sentence(4),
            'usage_context' => 'hero',
        ];
    }
}
