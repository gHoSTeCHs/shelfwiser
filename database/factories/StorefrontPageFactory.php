<?php

namespace Database\Factories;

use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorefrontPage>
 */
class StorefrontPageFactory extends Factory
{
    protected $model = StorefrontPage::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'shop_id' => fn (array $attributes) => Shop::factory()->create(['tenant_id' => $attributes['tenant_id']])->id,
            'storefront_config_id' => fn (array $attributes) => StorefrontConfig::query()
                ->where('shop_id', $attributes['shop_id'])
                ->first()?->id ?? StorefrontConfig::factory()->create([
                    'tenant_id' => $attributes['tenant_id'],
                    'shop_id' => $attributes['shop_id'],
                ])->id,
            'page_type' => fake()->randomElement(StorefrontPageType::cases()),
            'slug' => fn (array $attributes) => $attributes['page_type'] === StorefrontPageType::CUSTOM
                || $attributes['page_type'] === StorefrontPageType::CUSTOM->value
                ? fake()->unique()->slug()
                : ($attributes['page_type'] instanceof StorefrontPageType
                    ? $attributes['page_type']->value
                    : $attributes['page_type']),
            'title' => fake()->words(3, true),
            'sections' => [],
            'seo_title' => null,
            'seo_description' => null,
            'seo_image_path' => null,
            'is_published' => true,
            'sort_order' => 0,
        ];
    }

    public function custom(?string $slug = null): static
    {
        return $this->state([
            'page_type' => StorefrontPageType::CUSTOM,
            'slug' => $slug ?? fake()->unique()->slug(),
            'title' => fake()->words(3, true),
        ]);
    }
}
