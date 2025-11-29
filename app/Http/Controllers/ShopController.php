<?php

namespace App\Http\Controllers;

use App\Enums\InventoryModel;
use App\Helpers\CurrencyHelper;
use App\Http\Requests\CreateShopRequest;
use App\Http\Requests\UpdateShopRequest;
use App\Http\Requests\UpdateStorefrontSettingsRequest;
use App\Http\Resources\ShopResource;
use App\Models\Shop;
use App\Models\ShopType;
use App\Services\ShopCreationService;
use Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ShopController extends Controller
{
    public function __construct(private readonly ShopCreationService $creationService)
    {
    }

    /**
     * Show list of shops (Inertia page)
     */
    public function index()
    {
        Gate::authorize('create', Auth::user());

        $shops = Shop::query()->where('tenant_id', auth()->user()->tenant_id)
            ->with('type', 'users')
            ->withCount('products', 'users')
            ->latest()
            ->paginate(20);

        return Inertia::render('Shops/Index', [
            'shops' => $shops,
            'shopTypes' => ShopType::accessibleTo(auth()->user()->tenant_id)
                ->where('is_active', true)
                ->get(['slug', 'label']),
        ]);
    }

    /**
     * Show shop creation form (Inertia page)
     */
    public function create(): Response
    {
        Gate::authorize('create', Auth::user());

        $shopTypes = ShopType::accessibleTo(auth()->user()->tenant_id)
            ->where('is_active', true)
            ->get(['slug', 'label', 'description', 'config_schema']);

        return Inertia::render('Shops/Create', [
            'shopTypes' => $shopTypes,
            'inventoryModels' => InventoryModel::forSelectWithDescriptions(),
            'countries' => config('countries'),
        ]);
    }

    /**
     * Store new shop (Inertia POST)
     *
     * @throws Throwable
     */
    public function store(CreateShopRequest $request): RedirectResponse
    {

        $shop = $this->creationService->create(
            $request->validated(),
            $request->user()->tenant,
            $request->user()
        );

        return Redirect::route('shops.index', $shop)
            ->with('success', "Shop '$shop->name' created successfully.");
    }

    /**
     * Show single shop (Inertia page)
     */
    public function show(Shop $shop)
    {
        Gate::authorize('shop.view', $shop);

        return Inertia::render('Shops/Show', [
            'shop' => (new ShopResource($shop->load('type', 'users')))->toArray(request()),
            'can_manage' => auth()->user()->can('manage', 'shop'),
        ]);
    }

    /**
     * Show shop edit form (Inertia page)
     */
    public function edit(Shop $shop): Response
    {
        Gate::authorize('shop.manage', $shop);

        $shop->load('type');

        $shopTypes = ShopType::accessibleTo(auth()->user()->tenant_id)
            ->where('is_active', true)
            ->get(['id', 'slug', 'label', 'description', 'config_schema']);

        return Inertia::render('Shops/Edit', [
            'shop' => $shop,
            'shopTypes' => $shopTypes,
            'inventoryModels' => InventoryModel::forSelectWithDescriptions(),
            'countries' => config('countries'),
        ]);
    }

    /**
     * Update shop (Inertia PUT)
     */
    public function update(UpdateShopRequest $request, Shop $shop): RedirectResponse
    {
        $shop->update($request->validated());

        return Redirect::route('shops.show', $shop)
            ->with('success', "Shop '{$shop->name}' updated successfully.");
    }

    /**
     * Delete shop (Inertia DELETE)
     */
    public function destroy(Shop $shop): RedirectResponse
    {
        Gate::authorize('delete', $shop);

        $shop->delete();

        return Redirect::route('shops.index')
            ->with('success', 'Shop deleted successfully.');
    }

    /**
     * Show storefront settings form
     */
    public function editStorefrontSettings(Shop $shop): Response
    {
        Gate::authorize('manage', $shop);

        return Inertia::render('Shops/StorefrontSettings', [
            'shop' => $shop,
            'currencies' => CurrencyHelper::getSupportedCurrencies(),
        ]);
    }

    /**
     * Update storefront settings
     */
    public function updateStorefrontSettings(UpdateStorefrontSettingsRequest $request, Shop $shop): RedirectResponse
    {
        $validated = $request->validated();

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

        return Redirect::route('shops.storefront-settings.edit', $shop)
            ->with('success', 'Storefront settings updated successfully.');
    }
}
