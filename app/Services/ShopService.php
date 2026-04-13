<?php

namespace App\Services;

use App\Models\Shop;
use App\Models\ShopType;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ShopService
{
    public function getShopsForIndex(): LengthAwarePaginator
    {
        return Shop::query()
            ->with('type', 'users')
            ->withCount('products', 'users')
            ->latest()
            ->paginate(20);
    }

    public function getShopTypesForIndex(int $tenantId): Collection
    {
        return ShopType::accessibleTo($tenantId)
            ->where('is_active', true)
            ->get(['slug', 'label']);
    }

    public function getShopTypesForForm(int $tenantId): Collection
    {
        return ShopType::accessibleTo($tenantId)
            ->where('is_active', true)
            ->get(['id', 'slug', 'label', 'description', 'config_schema']);
    }

    public function updateStorefrontSettings(Shop $shop, array $validated): void
    {
        $storefrontSettings = [
            'shipping_fee' => $validated['shipping_fee'] ?? 0,
            'free_shipping_threshold' => $validated['free_shipping_threshold'] ?? 0,
            'theme_color' => $validated['theme_color'] ?? '#6366f1',
            'logo_url' => $validated['logo_url'] ?? null,
            'banner_url' => $validated['banner_url'] ?? null,
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
            'social_facebook' => $validated['social_facebook'] ?? null,
            'social_instagram' => $validated['social_instagram'] ?? null,
            'social_twitter' => $validated['social_twitter'] ?? null,
            'business_hours' => $validated['business_hours'] ?? null,
        ];

        $shop->update([
            'storefront_enabled' => $validated['storefront_enabled'],
            'allow_retail_sales' => $validated['allow_retail_sales'] ?? false,
            'currency' => $validated['currency'],
            'currency_symbol' => $validated['currency_symbol'],
            'currency_decimals' => $validated['currency_decimals'],
            'vat_enabled' => $validated['vat_enabled'],
            'vat_rate' => $validated['vat_rate'] ?? 0,
            'vat_inclusive' => $validated['vat_inclusive'] ?? false,
            'storefront_settings' => $storefrontSettings,
        ]);
    }
}
