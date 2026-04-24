<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateShopSettingsRequest;
use App\Models\Shop;
use App\Services\ShopService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ShopSettingsController extends Controller
{
    public function __construct(
        private readonly ShopService $shopService
    ) {}

    public function show(Shop $shop): Response
    {
        Gate::authorize('shop.manage', $shop);

        return Inertia::render('Settings/ShopSettings', [
            'shop' => $shop,
            ...$this->shopService->getSettingsFormData($shop),
        ]);
    }

    public function update(UpdateShopSettingsRequest $request, Shop $shop): RedirectResponse
    {
        Gate::authorize('update', $shop);

        $this->shopService->updateTaxSettings($shop, $request->validated());

        return redirect()
            ->back()
            ->with('success', 'Shop settings updated successfully');
    }
}
