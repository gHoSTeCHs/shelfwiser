<?php

use App\Cache\Concerns\DetectsTagSupport;
use App\Cache\StorefrontBuilderCache;
use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Storefront\StorefrontBuilderService;
use App\Services\Storefront\StorefrontRenderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
    DetectsTagSupport::resetTagDetection();
});

function buildCachingStack(): array
{
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create([
        'template_id' => $template->id,
        'theme_config' => [
            'palette' => [
                'presets' => [
                    ['name' => 'Default', 'primary' => '#e94560', 'secondary' => '#64748b'],
                ],
            ],
            'typography' => [
                'options' => [
                    ['name' => 'Default', 'heading_font' => 'DM Sans', 'body_font' => 'DM Sans'],
                ],
                'base_size' => 16,
                'line_height' => 1.6,
            ],
            'components' => ['button_style' => 'rounded'],
            'feel' => ['border_radius' => '8px'],
            'animation' => [],
            'header' => ['variant' => 'standard'],
            'footer' => ['variant' => 'simple'],
        ],
    ]);
    $config = StorefrontConfig::factory()->published()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);
    $page = StorefrontPage::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'is_published' => true,
        'sections' => [],
    ]);

    return compact('tenant', 'shop', 'user', 'template', 'theme', 'config', 'page');
}

it('serves cached theme config on second render call', function () {
    ['shop' => $shop, 'user' => $user, 'page' => $page] = buildCachingStack();
    test()->actingAs($user, 'web');

    $renderService = app(StorefrontRenderService::class);

    $queryCount1 = 0;
    \Illuminate\Support\Facades\DB::listen(function () use (&$queryCount1) {
        $queryCount1++;
    });

    $result1 = $renderService->buildPage($shop->fresh(), StorefrontPageType::HOME);
    $firstRunQueries = $queryCount1;

    $queryCount2 = 0;
    \Illuminate\Support\Facades\DB::listen(function () use (&$queryCount2) {
        $queryCount2++;
    });

    $result2 = $renderService->buildPage($shop->fresh(), StorefrontPageType::HOME);

    expect($result1['theme'])->toBe($result2['theme']);
    expect($result1['navigation'])->toBe($result2['navigation']);
});

it('invalidates cache when builder service modifies sections', function () {
    ['shop' => $shop, 'user' => $user, 'page' => $page, 'config' => $config] = buildCachingStack();
    test()->actingAs($user, 'web');

    $renderService = app(StorefrontRenderService::class);
    $builderService = app(StorefrontBuilderService::class);

    $result1 = $renderService->buildPage($shop->fresh(), StorefrontPageType::HOME);
    expect($result1['sections'])->toBeEmpty();

    $builderService->addSectionToPage($page, 'hero_banner', 'centered_overlay');

    $result2 = $renderService->buildPage($shop->fresh(), StorefrontPageType::HOME);
    expect($result2['navigation'])->toBeArray();
});

it('invalidates cache when theme defaults are reset', function () {
    ['shop' => $shop, 'user' => $user, 'config' => $config] = buildCachingStack();
    test()->actingAs($user, 'web');

    $renderService = app(StorefrontRenderService::class);
    $builderService = app(StorefrontBuilderService::class);
    $cache = app(StorefrontBuilderCache::class);

    $configCallCount = 0;
    $cache->config($shop, function () use (&$configCallCount) {
        $configCallCount++;

        return ['original' => true];
    });

    expect($configCallCount)->toBe(1);

    $builderService->resetToThemeDefaults($config);

    $cache->config($shop, function () use (&$configCallCount) {
        $configCallCount++;

        return ['reset' => true];
    });

    expect($configCallCount)->toBe(2);
});

it('does not share cache between different shops', function () {
    $stack1 = buildCachingStack();
    $stack2 = buildCachingStack();
    test()->actingAs($stack1['user'], 'web');

    $cache = app(StorefrontBuilderCache::class);

    $config1 = $cache->config($stack1['shop'], fn () => ['shop' => 'first']);
    $config2 = $cache->config($stack2['shop'], fn () => ['shop' => 'second']);

    expect($config1)->toBe(['shop' => 'first']);
    expect($config2)->toBe(['shop' => 'second']);

    $cache->invalidateShop($stack1['shop']);

    $callCount = 0;
    $config1After = $cache->config($stack1['shop'], function () use (&$callCount) {
        $callCount++;

        return ['shop' => 'first_refreshed'];
    });
    $config2After = $cache->config($stack2['shop'], function () use (&$callCount) {
        $callCount++;

        return ['shop' => 'second_refreshed'];
    });

    expect($config1After)->toBe(['shop' => 'first_refreshed']);
    expect($config2After)->toBe(['shop' => 'second']);
    expect($callCount)->toBe(1);
});
