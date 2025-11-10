<?php

namespace App\Services;

use App\Exceptions\TenantLimitExceededException;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShopCreationService
{
    public function create(array $data, Tenant $tenant, User $creator): Shop
    {
        return DB::transaction(function () use ($data, $tenant, $creator) {
            $shopType = $this->resolveShopType($data['shop_type_slug'], $tenant);

            $this->enforceTenantLimits($tenant);

            $handler = ShopConfigHandlerFactory::make($shopType);
            $config = array_merge($handler->getDefaults(), $data['config']);

            $slug = $this->generateUniqueSlug($data['name'], $tenant);

            $shop = Shop::query()->create([
                'tenant_id' => $tenant->id,
                'shop_type_id' => $shopType->id,
                'slug' => $slug,
                'name' => $data['name'],
                'address_line1' => $data['address_line1'] ?? null,
                'address_line2' => $data['address_line2'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'postal_code' => $data['postal_code'] ?? null,
                'country' => $data['country'] ?? 'Nigeria',
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'config' => $config,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if ($creator->can('manage', $shop)) {
                $shop->users()->attach($creator->id);
            }

//            event(new \App\Events\ShopCreated($shop, $creator));

            // 8. Clear relevant caches
            Cache::tags(["tenant:$tenant->id:shops"])->flush();

            return $shop->load('type', 'users');
        });
    }

    private function resolveShopType(string $slug, Tenant $tenant): ShopType
    {
        $cacheKey = "tenant:$tenant->id:shop_type:slug:$slug";

        return Cache::tags(["tenant:$tenant->id:shop_types"])
            ->remember($cacheKey, 3600, function () use ($slug, $tenant) {
                return ShopType::query()->accessibleTo($tenant->id)
                    ->where('slug', $slug)
                    ->firstOrFail();
            });
    }

    /**
     * @throws TenantLimitExceededException
     */
    private function enforceTenantLimits(Tenant $tenant): void
    {
        $currentCount = $tenant->shops()->count();
        $maxAllowed = $tenant->max_shops;

        if ($currentCount >= $maxAllowed) {
            throw new TenantLimitExceededException(
                "Shop limit reached: $maxAllowed shops maximum."
            );
        }
    }

    private function generateUniqueSlug(string $name, Tenant $tenant): string
    {
        $base = Str::slug($name);
        $slug = $base;

        for ($counter = 1; Shop::query()->where('tenant_id', $tenant->id)->where('slug', $slug)->exists(); $counter++) {
            $slug = "$base-$counter";
        }

        return $slug;
    }
}
