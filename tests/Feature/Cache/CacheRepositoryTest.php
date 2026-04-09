<?php

use App\Cache\CacheRepository;
use App\Cache\Concerns\DetectsTagSupport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
    DetectsTagSupport::resetTagDetection();
});

function makeTestRepo(string $prefix = 'test'): CacheRepository
{
    return new class($prefix) extends CacheRepository
    {
        public function __construct(string $prefix)
        {
            $this->prefix = $prefix;
        }

        public function publicKey(string|int ...$segments): string
        {
            return $this->key(...$segments);
        }

        public function publicKeyFor(int $tenantId, string|int ...$segments): string
        {
            return $this->keyFor($tenantId, ...$segments);
        }

        public function publicTag(string|int ...$segments): string
        {
            return $this->tag(...$segments);
        }

        public function publicTagFor(int $tenantId, string|int ...$segments): string
        {
            return $this->tagFor($tenantId, ...$segments);
        }

        public function publicRemember(string $key, int $ttl, Closure $resolver, array $tags = []): mixed
        {
            return $this->remember($key, $ttl, $resolver, $tags);
        }

        public function publicForget(string $key, array $tags = []): void
        {
            $this->forget($key, $tags);
        }

        public function publicFlushTag(string $tag): void
        {
            $this->flushTag($tag);
        }

        public function publicResolveTenantId(?int $tenantId = null): int
        {
            return $this->resolveTenantId($tenantId);
        }
    };
}

it('produces correct key with tenant prefix from auth context', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'web');
    $repo = makeTestRepo('storefront');

    $key = $repo->publicKey('featured_products', 5, 8);

    expect($key)->toBe($user->tenant_id.':storefront:featured_products:5:8');
});

it('produces correct key with explicit tenant ID via keyFor', function () {
    $repo = makeTestRepo('storefront');

    $key = $repo->publicKeyFor(42, 'featured_products', 5, 8);

    expect($key)->toBe('42:storefront:featured_products:5:8');
});

it('produces same output from key and keyFor for same tenant', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'web');
    $repo = makeTestRepo('storefront');

    $fromKey = $repo->publicKey('products', 1);
    $fromKeyFor = $repo->publicKeyFor($user->tenant_id, 'products', 1);

    expect($fromKey)->toBe($fromKeyFor);
});

it('produces correct tag strings', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'web');
    $repo = makeTestRepo('storefront');

    $tag = $repo->publicTag('shop', 5);

    expect($tag)->toBe($user->tenant_id.':storefront:shop:5');
});

it('produces correct tag strings via tagFor', function () {
    $repo = makeTestRepo('storefront');

    $tag = $repo->publicTagFor(42, 'shop', 5);

    expect($tag)->toBe('42:storefront:shop:5');
});

it('resolves tenant ID from web guard', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'web');
    $repo = makeTestRepo();

    expect($repo->publicResolveTenantId())->toBe($user->tenant_id);
});

it('resolves tenant ID from customer guard when web is not available', function () {
    $customer = \App\Models\Customer::factory()->create();
    $this->actingAs($customer, 'customer');
    $repo = makeTestRepo();

    expect($repo->publicResolveTenantId())->toBe($customer->tenant_id);
});

it('accepts explicit tenant ID override', function () {
    $repo = makeTestRepo();

    expect($repo->publicResolveTenantId(99))->toBe(99);
});

it('throws when no auth context and no explicit tenant ID', function () {
    $repo = makeTestRepo();

    $repo->publicResolveTenantId();
})->throws(\RuntimeException::class, 'Cannot resolve tenant ID for cache key');

it('caches on first call and returns cached on second', function () {
    $repo = makeTestRepo();
    $callCount = 0;
    $resolver = function () use (&$callCount) {
        $callCount++;

        return 'resolved_value';
    };

    $first = $repo->publicRemember('test:key', 60, $resolver);
    $second = $repo->publicRemember('test:key', 60, $resolver);

    expect($first)->toBe('resolved_value');
    expect($second)->toBe('resolved_value');
    expect($callCount)->toBe(1);
});

it('remember with tags uses Cache::tags when available', function () {
    $repo = makeTestRepo();
    $callCount = 0;
    $resolver = function () use (&$callCount) {
        $callCount++;

        return 'tagged_value';
    };

    $result = $repo->publicRemember('test:tagged', 60, $resolver, ['my_tag']);

    expect($result)->toBe('tagged_value');
    expect($callCount)->toBe(1);

    $cachedViaTag = Cache::tags(['my_tag'])->get('test:tagged');
    expect($cachedViaTag)->toBe('tagged_value');
});

it('forget removes a specific key', function () {
    $repo = makeTestRepo();

    $repo->publicRemember('test:forget_me', 60, fn () => 'value');
    expect(Cache::has('test:forget_me'))->toBeTrue();

    $repo->publicForget('test:forget_me');
    expect(Cache::has('test:forget_me'))->toBeFalse();
});

it('flushTag removes all keys associated with a tag', function () {
    $repo = makeTestRepo();

    $repo->publicRemember('test:a', 60, fn () => 'a', ['shared_tag']);
    $repo->publicRemember('test:b', 60, fn () => 'b', ['shared_tag']);
    $repo->publicRemember('test:c', 60, fn () => 'c', ['other_tag']);

    $repo->publicFlushTag('shared_tag');

    $callCount = 0;
    $aResult = $repo->publicRemember('test:a', 60, function () use (&$callCount) {
        $callCount++;

        return 'a_new';
    }, ['shared_tag']);

    expect($aResult)->toBe('a_new');
    expect($callCount)->toBe(1);
});

it('uses different prefixes for different repos', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'web');

    $repoA = makeTestRepo('dashboard');
    $repoB = makeTestRepo('storefront');

    $keyA = $repoA->publicKey('metrics');
    $keyB = $repoB->publicKey('metrics');

    expect($keyA)->not->toBe($keyB);
    expect($keyA)->toContain(':dashboard:');
    expect($keyB)->toContain(':storefront:');
});
