<?php

use App\Enums\StorefrontPageType;
use App\Enums\UserRole;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTemplate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\StorefrontTemplateSeeder::class);
    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create(['tenant_id' => $this->tenant->id, 'storefront_enabled' => true]);
    $this->owner = User::factory()->create(['tenant_id' => $this->tenant->id, 'role' => UserRole::OWNER]);
    $this->cashier = User::factory()->create(['tenant_id' => $this->tenant->id, 'role' => UserRole::CASHIER]);
    $this->template = StorefrontTemplate::query()->where('slug', 'classic-commerce')->first();
    $this->theme = $this->template->themes()->first();
});

it('selects theme and initializes storefront', function () {
    $this->actingAs($this->owner)
        ->postJson(route('shops.storefront-builder.theme', $this->shop), [
            'theme_id' => $this->theme->id,
        ])
        ->assertOk()
        ->assertJsonStructure(['config', 'message']);

    expect($this->shop->fresh()->storefrontConfig)->not->toBeNull();
});

it('returns builder data with config and section manifest', function () {
    StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);

    $this->actingAs($this->owner)
        ->getJson(route('shops.storefront-builder.data', $this->shop))
        ->assertOk()
        ->assertJsonStructure(['config', 'pages', 'sectionManifest']);
});

it('returns empty builder data when no config exists', function () {
    $this->actingAs($this->owner)
        ->getJson(route('shops.storefront-builder.data', $this->shop))
        ->assertOk()
        ->assertJson(['config' => null, 'pages' => [], 'sectionManifest' => []]);
});

it('prevents cashiers from accessing builder', function () {
    $this->actingAs($this->cashier)
        ->getJson(route('shops.storefront-builder.data', $this->shop))
        ->assertForbidden();
});

it('prevents cross-tenant access to builder', function () {
    $otherTenant = Tenant::factory()->create();
    $otherUser = User::factory()->create(['tenant_id' => $otherTenant->id, 'role' => UserRole::OWNER]);

    $this->actingAs($otherUser)
        ->getJson(route('shops.storefront-builder.data', $this->shop))
        ->assertNotFound();
});

it('adds section to page', function () {
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);
    StorefrontPage::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'sections' => [],
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('shops.storefront-builder.section.add', [$this->shop, 'home']), [
            'type' => 'hero_banner',
            'variant' => 'default',
        ])
        ->assertOk();

    $page = StorefrontPage::query()->where('shop_id', $this->shop->id)->where('page_type', StorefrontPageType::HOME)->first();
    expect($page->sections)->toHaveCount(1);
    expect($page->sections[0]['type'])->toBe('hero_banner');
});

it('rejects invalid section type', function () {
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);
    StorefrontPage::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'sections' => [],
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('shops.storefront-builder.section.add', [$this->shop, 'home']), [
            'type' => 'totally_fake_section',
            'variant' => 'default',
        ])
        ->assertUnprocessable();
});

it('updates section config', function () {
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);
    StorefrontPage::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'sections' => [
            ['id' => 'sec_abcdef123456', 'type' => 'hero_banner', 'variant' => 'default', 'is_visible' => true, 'config' => ['heading' => 'Old']],
        ],
    ]);

    $this->actingAs($this->owner)
        ->putJson(route('shops.storefront-builder.section.update', [$this->shop, 'home', 'sec_abcdef123456']), [
            'config' => ['heading' => 'New Heading'],
        ])
        ->assertOk();

    $page = StorefrontPage::query()->where('shop_id', $this->shop->id)->where('page_type', StorefrontPageType::HOME)->first();
    expect($page->sections[0]['config']['heading'])->toBe('New Heading');
});

it('removes section from page', function () {
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);
    StorefrontPage::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'sections' => [
            ['id' => 'sec_remove123abc', 'type' => 'hero_banner', 'variant' => 'default', 'is_visible' => true, 'config' => []],
            ['id' => 'sec_keep456789ab', 'type' => 'spacer', 'variant' => 'default', 'is_visible' => true, 'config' => []],
        ],
    ]);

    $this->actingAs($this->owner)
        ->deleteJson(route('shops.storefront-builder.section.remove', [$this->shop, 'home', 'sec_remove123abc']))
        ->assertOk();

    $page = StorefrontPage::query()->where('shop_id', $this->shop->id)->where('page_type', StorefrontPageType::HOME)->first();
    expect($page->sections)->toHaveCount(1);
    expect($page->sections[0]['id'])->toBe('sec_keep456789ab');
});

it('publishes storefront', function () {
    StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
        'is_published' => false,
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('shops.storefront-builder.publish', $this->shop))
        ->assertOk();

    expect($this->shop->fresh()->storefrontConfig->is_published)->toBeTrue();
});

it('unpublishes storefront', function () {
    StorefrontConfig::factory()->published()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('shops.storefront-builder.unpublish', $this->shop))
        ->assertOk();

    expect($this->shop->fresh()->storefrontConfig->is_published)->toBeFalse();
});

it('updates config overrides', function () {
    StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);

    $this->actingAs($this->owner)
        ->putJson(route('shops.storefront-builder.config', $this->shop), [
            'color_overrides' => ['primary' => '#ff0000'],
            'global_announcement' => ['text' => 'Sale today!', 'enabled' => true],
        ])
        ->assertOk();

    $config = $this->shop->fresh()->storefrontConfig;
    expect($config->color_overrides['primary'])->toBe('#ff0000');
    expect($config->global_announcement['text'])->toBe('Sale today!');
});

it('resets to theme defaults', function () {
    StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
        'color_overrides' => ['primary' => '#ff0000'],
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('shops.storefront-builder.reset', $this->shop))
        ->assertOk();

    expect($this->shop->fresh()->storefrontConfig->color_overrides)->toBeNull();
});
