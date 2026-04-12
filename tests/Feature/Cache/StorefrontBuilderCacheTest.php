<?php

use App\Cache\Concerns\DetectsTagSupport;
use App\Cache\StorefrontBuilderCache;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
    DetectsTagSupport::resetTagDetection();

    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->actingAs($this->user, 'web');

    $this->cache = app(StorefrontBuilderCache::class);
});

it('caches config and returns it on second call without re-executing resolver', function () {
    $callCount = 0;
    $resolver = function () use (&$callCount) {
        $callCount++;

        return ['colors' => ['primary' => '#ff0000']];
    };

    $first = $this->cache->config($this->shop, $resolver);
    $second = $this->cache->config($this->shop, $resolver);

    expect($first)->toBe(['colors' => ['primary' => '#ff0000']]);
    expect($second)->toBe($first);
    expect($callCount)->toBe(1);
});

it('caches page data per page type', function () {
    $homeCallCount = 0;
    $productsCallCount = 0;

    $homeResolver = function () use (&$homeCallCount) {
        $homeCallCount++;

        return ['page' => 'home'];
    };

    $productsResolver = function () use (&$productsCallCount) {
        $productsCallCount++;

        return ['page' => 'products'];
    };

    $home = $this->cache->page($this->shop, \App\Enums\StorefrontPageType::HOME, null, $homeResolver);
    $products = $this->cache->page($this->shop, \App\Enums\StorefrontPageType::PRODUCTS, null, $productsResolver);

    expect($home)->toBe(['page' => 'home']);
    expect($products)->toBe(['page' => 'products']);
    expect($homeCallCount)->toBe(1);
    expect($productsCallCount)->toBe(1);
});

it('caches navigation and returns cached on second call', function () {
    $callCount = 0;
    $resolver = function () use (&$callCount) {
        $callCount++;

        return ['items' => [['label' => 'Home']]];
    };

    $this->cache->navigation($this->shop, $resolver);
    $this->cache->navigation($this->shop, $resolver);

    expect($callCount)->toBe(1);
});

it('invalidateConfig clears only the config key', function () {
    $configCalls = 0;
    $navCalls = 0;

    $this->cache->config($this->shop, function () use (&$configCalls) {
        $configCalls++;

        return ['config' => true];
    });
    $this->cache->navigation($this->shop, function () use (&$navCalls) {
        $navCalls++;

        return ['nav' => true];
    });

    $this->cache->invalidateConfig($this->shop);

    $this->cache->config($this->shop, function () use (&$configCalls) {
        $configCalls++;

        return ['config' => true];
    });
    $this->cache->navigation($this->shop, function () use (&$navCalls) {
        $navCalls++;

        return ['nav' => true];
    });

    expect($configCalls)->toBe(2);
    expect($navCalls)->toBe(1);
});

it('invalidateShop flushes all keys for that shop via tag', function () {
    $configCalls = 0;
    $navCalls = 0;

    $this->cache->config($this->shop, function () use (&$configCalls) {
        $configCalls++;

        return ['config' => true];
    });
    $this->cache->navigation($this->shop, function () use (&$navCalls) {
        $navCalls++;

        return ['nav' => true];
    });

    $this->cache->invalidateShop($this->shop);

    $this->cache->config($this->shop, function () use (&$configCalls) {
        $configCalls++;

        return ['config' => true];
    });
    $this->cache->navigation($this->shop, function () use (&$navCalls) {
        $navCalls++;

        return ['nav' => true];
    });

    expect($configCalls)->toBe(2);
    expect($navCalls)->toBe(2);
});

it('does not invalidate a different shop when flushing one shop', function () {
    $otherShop = Shop::factory()->create(['tenant_id' => $this->tenant->id]);

    $shopACalls = 0;
    $shopBCalls = 0;

    $this->cache->config($this->shop, function () use (&$shopACalls) {
        $shopACalls++;

        return ['shop' => 'A'];
    });
    $this->cache->config($otherShop, function () use (&$shopBCalls) {
        $shopBCalls++;

        return ['shop' => 'B'];
    });

    $this->cache->invalidateShop($this->shop);

    $this->cache->config($this->shop, function () use (&$shopACalls) {
        $shopACalls++;

        return ['shop' => 'A'];
    });
    $this->cache->config($otherShop, function () use (&$shopBCalls) {
        $shopBCalls++;

        return ['shop' => 'B'];
    });

    expect($shopACalls)->toBe(2);
    expect($shopBCalls)->toBe(1);
});
