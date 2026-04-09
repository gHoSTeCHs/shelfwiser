<?php

namespace App\Cache;

use App\Enums\StorefrontPageType;
use App\Models\Shop;
use Closure;

class StorefrontBuilderCache extends CacheRepository
{
    protected string $prefix = 'storefront_builder';

    public function config(Shop $shop, Closure $resolver): array
    {
        return $this->remember(
            key: $this->keyFor($shop->tenant_id, 'config', $shop->id),
            ttl: 3600,
            resolver: $resolver,
            tags: [$this->tagFor($shop->tenant_id, 'shop', $shop->id)],
        );
    }

    public function page(Shop $shop, StorefrontPageType $pageType, ?string $slug, Closure $resolver): array
    {
        $segments = [$shop->id, $pageType->value];
        if ($slug !== null) {
            $segments[] = $slug;
        }

        return $this->remember(
            key: $this->keyFor($shop->tenant_id, 'page', ...$segments),
            ttl: 900,
            resolver: $resolver,
            tags: [$this->tagFor($shop->tenant_id, 'shop', $shop->id)],
        );
    }

    public function navigation(Shop $shop, Closure $resolver): array
    {
        return $this->remember(
            key: $this->keyFor($shop->tenant_id, 'navigation', $shop->id),
            ttl: 3600,
            resolver: $resolver,
            tags: [$this->tagFor($shop->tenant_id, 'shop', $shop->id)],
        );
    }

    public function invalidateConfig(Shop $shop): void
    {
        $this->forget(
            $this->keyFor($shop->tenant_id, 'config', $shop->id),
            [$this->tagFor($shop->tenant_id, 'shop', $shop->id)]
        );
    }

    public function invalidateNavigation(Shop $shop): void
    {
        $this->forget(
            $this->keyFor($shop->tenant_id, 'navigation', $shop->id),
            [$this->tagFor($shop->tenant_id, 'shop', $shop->id)]
        );
    }

    public function invalidateShop(Shop $shop): void
    {
        $this->flushTag($this->tagFor($shop->tenant_id, 'shop', $shop->id));
    }
}
