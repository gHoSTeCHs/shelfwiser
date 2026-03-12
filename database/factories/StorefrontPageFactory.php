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
            'shop_id' => Shop::factory(),
            'storefront_config_id' => StorefrontConfig::factory(),
            'page_type' => StorefrontPageType::HOME,
            'slug' => null,
            'title' => 'Home',
            'sections' => [],
            'seo_title' => null,
            'seo_description' => null,
            'seo_image_path' => null,
            'is_published' => true,
            'sort_order' => 0,
        ];
    }

    public function custom(string $slug = null): static
    {
        return $this->state([
            'page_type' => StorefrontPageType::CUSTOM,
            'slug' => $slug ?? fake()->unique()->slug(),
            'title' => fake()->words(3, true),
        ]);
    }
}
