<?php

use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function createPublishedStorefront(array $shopOverrides = []): array
{
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(array_merge([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ], $shopOverrides));
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    $config = StorefrontConfig::factory()->published()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    return compact('tenant', 'shop', 'template', 'theme', 'config');
}

it('renders home page with complete page payload', function () {
    ['shop' => $shop, 'config' => $config] = createPublishedStorefront();
    StorefrontPage::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'title' => 'Home',
        'sections' => [],
    ]);

    $response = $this->get("/store/{$shop->slug}");

    $response->assertOk();
    $response->assertViewIs('storefront.builder-app');
    $response->assertViewHas('pageData');
});

it('returns 404 for unpublished storefront', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
        'is_published' => false,
    ]);

    $response = $this->get("/store/{$shop->slug}");

    $response->assertNotFound();
});

it('returns 404 when storefront is disabled on shop', function () {
    ['shop' => $shop, 'config' => $config] = createPublishedStorefront(['storefront_enabled' => false]);
    StorefrontPage::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
    ]);

    $response = $this->get("/store/{$shop->slug}");

    $response->assertNotFound();
});

it('renders products page', function () {
    ['shop' => $shop, 'config' => $config] = createPublishedStorefront();
    StorefrontPage::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::PRODUCTS,
        'title' => 'Products',
    ]);

    $response = $this->get("/store/{$shop->slug}/products");

    $response->assertOk();
    $response->assertViewIs('storefront.builder-app');
});

it('renders login page for guests', function () {
    ['shop' => $shop] = createPublishedStorefront();

    $response = $this->get("/store/{$shop->slug}/login");

    $response->assertOk();
    $response->assertViewIs('storefront.builder-app');
    $response->assertViewHas('pageData', fn (array $data) => $data['fixedPage'] === 'login'
    );
});

it('renders cart page', function () {
    ['shop' => $shop] = createPublishedStorefront();

    $response = $this->get("/store/{$shop->slug}/cart");

    $response->assertOk();
    $response->assertViewIs('storefront.builder-app');
    $response->assertViewHas('pageData', fn (array $data) => $data['fixedPage'] === 'cart'
    );
});

it('page data contains theme styles', function () {
    ['shop' => $shop, 'config' => $config] = createPublishedStorefront();
    StorefrontPage::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'title' => 'Home',
        'sections' => [],
    ]);

    $response = $this->get("/store/{$shop->slug}");

    $response->assertViewHas('themeStyles');
});
