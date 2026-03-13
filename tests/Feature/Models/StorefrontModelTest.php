<?php

use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontMedia;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('template has many themes', function () {
    $template = StorefrontTemplate::factory()->create();
    StorefrontTheme::factory()->count(3)->create(['template_id' => $template->id]);

    expect($template->themes)->toHaveCount(3);
    expect($template->themes->first())->toBeInstanceOf(StorefrontTheme::class);
});

it('theme belongs to template', function () {
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);

    expect($theme->template)->toBeInstanceOf(StorefrontTemplate::class);
    expect($theme->template->id)->toBe($template->id);
});

it('config belongs to shop and theme', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);

    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    expect($config->shop)->toBeInstanceOf(Shop::class);
    expect($config->theme)->toBeInstanceOf(StorefrontTheme::class);
    expect($shop->fresh()->storefrontConfig)->toBeInstanceOf(StorefrontConfig::class);
});

it('page belongs to config and has sections as array', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    $page = StorefrontPage::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'sections' => [
            ['id' => 'sec_1', 'type' => 'hero_banner', 'variant' => 'centered_overlay', 'is_visible' => true, 'config' => []],
        ],
    ]);

    expect($page->sections)->toBeArray();
    expect($page->sections[0]['type'])->toBe('hero_banner');
});

it('enforces one config per shop', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);

    StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    expect(fn () => StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

it('media belongs to shop', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);

    $media = StorefrontMedia::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
    ]);

    expect($media->shop)->toBeInstanceOf(Shop::class);
    expect($media->shop->id)->toBe($shop->id);
});

it('config has many pages', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    $pageTypes = [\App\Enums\StorefrontPageType::HOME, \App\Enums\StorefrontPageType::PRODUCTS, \App\Enums\StorefrontPageType::ABOUT];

    foreach ($pageTypes as $pageType) {
        StorefrontPage::factory()->create([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'storefront_config_id' => $config->id,
            'page_type' => $pageType,
            'slug' => $pageType->value,
        ]);
    }

    expect($config->pages)->toHaveCount(3);
    expect($config->pages->first())->toBeInstanceOf(StorefrontPage::class);
});
