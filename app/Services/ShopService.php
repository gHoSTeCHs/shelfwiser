<?php

namespace App\Services;

use App\Enums\PayFrequency;
use App\Enums\TaxHandling;
use App\Models\Shop;
use App\Models\ShopTaxSetting;
use App\Models\ShopType;
use App\Models\TaxJurisdiction;
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

    /**
     * Soft-delete a shop. Refuses if the shop has open orders (anything not
     * cancelled, refunded, or delivered), since deleting it would orphan
     * customer-facing records.
     *
     * @throws \RuntimeException
     */
    public function delete(Shop $shop): void
    {
        $hasOpenOrders = \App\Models\Order::query()
            ->where('shop_id', $shop->id)
            ->whereNotIn('status', ['cancelled', 'refunded', 'delivered'])
            ->exists();

        if ($hasOpenOrders) {
            throw new \RuntimeException('Cannot delete a shop with open orders. Resolve them first.');
        }

        $shop->delete();

        \Illuminate\Support\Facades\Log::info('Shop deleted', ['shop_id' => $shop->id, 'name' => $shop->name]);
    }

    public function update(Shop $shop, array $validated): Shop
    {
        $allowed = [
            'name', 'inventory_model', 'address', 'city', 'state', 'country',
            'phone', 'email', 'is_active', 'shop_type_slug', 'config',
        ];

        $shop->update(array_intersect_key($validated, array_flip($allowed)));

        return $shop->refresh();
    }

    public function getSettingsFormData(Shop $shop): array
    {
        $shop->load('taxSettings.taxJurisdiction');

        $taxJurisdictions = TaxJurisdiction::query()
            ->where('is_active', true)
            ->orderBy('country_code')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'country_code']);

        return [
            'taxSettings' => $shop->taxSettings,
            'taxJurisdictions' => $taxJurisdictions,
            'taxHandlingOptions' => collect(TaxHandling::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
            ]),
            'payFrequencyOptions' => collect(PayFrequency::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ];
    }

    public function updateTaxSettings(Shop $shop, array $validated): void
    {
        if ($shop->taxSettings) {
            $shop->taxSettings->update($validated);
        } else {
            ShopTaxSetting::query()->create([
                ...$validated,
                'shop_id' => $shop->id,
                'tenant_id' => $shop->tenant_id,
            ]);
        }
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
