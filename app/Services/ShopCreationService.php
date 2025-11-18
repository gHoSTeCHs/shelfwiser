<?php

namespace App\Services;

use App\Exceptions\TenantLimitExceededException;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ShopCreationService
{
    /**
     * @throws Throwable
     * @throws TenantLimitExceededException
     */
    public function create(array $data, Tenant $tenant, User $creator): Shop
    {
        Log::info('Shop creation process started.', [
            'tenant_id' => $tenant->id,
            'creator_id' => $creator->id,
            'data' => $data,
        ]);

        try {
            return DB::transaction(function () use ($data, $tenant, $creator) {
                $shopType = $this->resolveShopType($data['shop_type_slug'], $tenant);

                $this->enforceTenantLimits($tenant);

                $handler = ShopConfigHandlerFactory::make($shopType);
                $config = array_merge($handler->getDefaults(), $data['config']);

                $slug = $this->generateUniqueSlug($data['name'], $tenant);

                $shopData = array_merge($data, [
                    'tenant_id' => $tenant->id,
                    'shop_type_id' => $shopType->id,
                    'slug' => $slug,
                    'config' => $config,
                    'is_active' => $data['is_active'] ?? true,
                ]);

                $shop = Shop::query()->create($shopData);

                if ($creator->can('manage', $shop)) {
                    $shop->users()->attach($creator->id, ['tenant_id' => $tenant->id]);
                }

                //            event(new \App\Events\ShopCreated($shop, $creator));

                Cache::tags(["tenant:$tenant->id:shops"])->flush();

                Log::info('Shop created successfully.', ['shop_id' => $shop->id]);

                return $shop->load('type', 'users');
            });
        } catch (Throwable $e) {
            Log::error('Shop creation failed.', [
                'tenant_id' => $tenant->id,
                'creator_id' => $creator->id,
                'data' => $data,
                'exception' => $e,
            ]);

            throw $e;
        }
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
