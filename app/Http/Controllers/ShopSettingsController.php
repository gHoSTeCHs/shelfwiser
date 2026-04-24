<?php

namespace App\Http\Controllers;

use App\Enums\PayFrequency;
use App\Enums\TaxHandling;
use App\Http\Requests\UpdateShopSettingsRequest;
use App\Models\Shop;
use App\Models\TaxJurisdiction;
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

    /**
     * Show shop tax and payroll settings
     */
    public function show(Shop $shop): Response
    {
        Gate::authorize('shop.manage', $shop);

        $shop->load('taxSettings.taxJurisdiction');

        $taxJurisdictions = TaxJurisdiction::query()->where('is_active', true)
            ->orderBy('country_code')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'country_code']);

        return Inertia::render('Settings/ShopSettings', [
            'shop' => $shop,
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
