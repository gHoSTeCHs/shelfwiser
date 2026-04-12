<?php

namespace App\Cache;

use App\Cache\Concerns\DetectsTagSupport;
use Closure;
use Illuminate\Support\Facades\Cache;

abstract class CacheRepository
{
    use DetectsTagSupport;

    protected string $prefix;

    protected function resolveTenantId(?int $tenantId = null): int
    {
        if ($tenantId !== null) {
            return $tenantId;
        }

        if (auth('web')->hasUser()) {
            return auth('web')->user()->tenant_id;
        }

        if (auth('customer')->hasUser()) {
            return auth('customer')->user()->tenant_id;
        }

        throw new \RuntimeException('Cannot resolve tenant ID for cache key. Pass tenantId explicitly in non-request contexts.');
    }

    protected function key(string|int ...$segments): string
    {
        $tenantId = $this->resolveTenantId();

        return $this->buildKey($tenantId, ...$segments);
    }

    protected function keyFor(int $tenantId, string|int ...$segments): string
    {
        return $this->buildKey($tenantId, ...$segments);
    }

    protected function tag(string|int ...$segments): string
    {
        $tenantId = $this->resolveTenantId();

        return $this->buildTag($tenantId, ...$segments);
    }

    protected function tagFor(int $tenantId, string|int ...$segments): string
    {
        return $this->buildTag($tenantId, ...$segments);
    }

    protected function remember(string $key, int $ttl, Closure $resolver, array $tags = []): mixed
    {
        if (empty($tags)) {
            return Cache::remember($key, $ttl, $resolver);
        }

        if ($this->tagsAvailable()) {
            return Cache::tags($tags)->remember($key, $ttl, $resolver);
        }

        $result = Cache::remember($key, $ttl, $resolver);
        $this->trackKeyInTagIndex($key, $tags);

        return $result;
    }

    protected function forget(string $key, array $tags = []): void
    {
        if (! empty($tags) && $this->tagsAvailable()) {
            Cache::tags($tags)->forget($key);

            return;
        }

        Cache::forget($key);
    }

    protected function flushTag(string $tag): void
    {
        if ($this->tagsAvailable()) {
            Cache::tags([$tag])->flush();

            return;
        }

        $indexKey = $this->tagIndexKey($tag);
        $trackedKeys = Cache::get($indexKey, []);

        foreach ($trackedKeys as $trackedKey) {
            Cache::forget($trackedKey);
        }

        Cache::forget($indexKey);
    }

    private function buildKey(int $tenantId, string|int ...$segments): string
    {
        return $tenantId.':'.$this->prefix.':'.implode(':', $segments);
    }

    private function buildTag(int $tenantId, string|int ...$segments): string
    {
        return $tenantId.':'.$this->prefix.':'.implode(':', $segments);
    }

    private function trackKeyInTagIndex(string $key, array $tags): void
    {
        foreach ($tags as $tag) {
            $indexKey = $this->tagIndexKey($tag);
            $tracked = Cache::get($indexKey, []);

            if (! in_array($key, $tracked, true)) {
                $tracked[] = $key;
                Cache::forever($indexKey, $tracked);
            }
        }
    }

    private function tagIndexKey(string $tag): string
    {
        return '_tag_idx:'.$tag;
    }
}
