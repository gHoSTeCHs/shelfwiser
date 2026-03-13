<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontTheme;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorefrontConfig>
 */
class StorefrontConfigFactory extends Factory
{
    protected $model = StorefrontConfig::class;

    public function definition(): array
    {
        $tenant = Tenant::factory()->create();

        return [
            'tenant_id' => $tenant->id,
            'shop_id' => Shop::factory()->state(['tenant_id' => $tenant->id]),
            'theme_id' => StorefrontTheme::factory(),
            'color_preset' => null,
            'color_overrides' => null,
            'typography_preset' => null,
            'typography_overrides' => null,
            'component_overrides' => null,
            'feel_overrides' => null,
            'animation_overrides' => null,
            'header_overrides' => null,
            'footer_overrides' => null,
            'logo_path' => null,
            'favicon_path' => null,
            'social_links' => null,
            'global_announcement' => null,
            'custom_css' => null,
            'seo_defaults' => null,
            'is_published' => false,
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state([
            'is_published' => true,
            'published_at' => now(),
        ]);
    }
}
