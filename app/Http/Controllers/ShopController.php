<?php

namespace App\Http\Controllers;

use App\Enums\InventoryModel;
use App\Helpers\CurrencyHelper;
use App\Http\Requests\CreateShopRequest;
use App\Http\Requests\UpdateShopRequest;
use App\Http\Requests\UpdateStorefrontSettingsRequest;
use App\Http\Resources\ShopResource;
use App\Models\Shop;
use App\Services\ShopCreationService;
use App\Services\ShopService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ShopController extends Controller
{
    public function __construct(
        private readonly ShopCreationService $creationService,
        private readonly ShopService $shopService,
    ) {}

    /**
     * Show list of shops (Inertia page)
     */
    public function index(): Response
    {
        Gate::authorize('create', Shop::class);

        $tenantId = request()->user()->tenant_id;

        return Inertia::render('Shops/Index', [
            'shops' => $this->shopService->getShopsForIndex(),
            'shopTypes' => $this->shopService->getShopTypesForIndex($tenantId),
        ]);
    }

    /**
     * Show shop creation form (Inertia page)
     */
    public function create(): Response
    {
        Gate::authorize('create', Shop::class);

        return Inertia::render('Shops/Create', [
            'shopTypes' => $this->shopService->getShopTypesForForm(request()->user()->tenant_id),
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
        Gate::authorize('create', Shop::class);

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
            'can_manage' => auth()->user()->can('shop.manage', $shop),
        ]);
    }

    /**
     * Show shop edit form (Inertia page)
     */
    public function edit(Shop $shop): Response
    {
        Gate::authorize('shop.manage', $shop);

        return Inertia::render('Shops/Edit', [
            'shop' => $shop->load('type'),
            'shopTypes' => $this->shopService->getShopTypesForForm(request()->user()->tenant_id),
            'inventoryModels' => InventoryModel::forSelectWithDescriptions(),
            'countries' => config('countries'),
        ]);
    }

    /**
     * Update shop (Inertia PUT)
     */
    public function update(UpdateShopRequest $request, Shop $shop): RedirectResponse
    {
        Gate::authorize('shop.manage', $shop);

        $this->shopService->update($shop, $request->validated());

        return Redirect::route('shops.show', $shop)
            ->with('success', "Shop '{$shop->name}' updated successfully.");
    }

    /**
     * Delete shop (Inertia DELETE)
     */
    public function destroy(Shop $shop): RedirectResponse
    {
        Gate::authorize('delete', $shop);

        try {
            $this->shopService->delete($shop);

            return Redirect::route('shops.index')
                ->with('success', 'Shop deleted successfully.');
        } catch (\RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    /**
     * Show storefront settings form
     */
    public function editStorefrontSettings(Shop $shop): Response
    {
        Gate::authorize('shop.manage', $shop);

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
        Gate::authorize('shop.manage', $shop);

        $this->shopService->updateStorefrontSettings($shop, $request->validated());

        return Redirect::route('shops.storefront-settings.edit', $shop)
            ->with('success', 'Storefront settings updated successfully.');
    }
}
