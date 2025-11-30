<?php

namespace App\Http\Controllers;

use App\Enums\PayFrequency;
use App\Enums\TaxHandling;
use App\Models\Shop;
use App\Models\ShopTaxSetting;
use App\Models\TaxJurisdiction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ShopSettingsController extends Controller
{
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

    /**
     * Update shop tax and payroll settings
     * @throws Throwable
     */
    public function update(Request $request, Shop $shop): RedirectResponse
    {
        Gate::authorize('update', $shop);

        $validated = $request->validate([
            'tax_jurisdiction_id' => ['nullable', 'exists:tax_jurisdictions,id'],
            'enable_tax_calculations' => ['required', 'boolean'],
            'default_tax_handling' => ['required', Rule::in(array_column(TaxHandling::cases(), 'value'))],
            'overtime_threshold_hours' => ['required', 'numeric', 'min:0', 'max:168'],
            'overtime_multiplier' => ['required', 'numeric', 'min:1', 'max:5'],
            'default_payroll_frequency' => ['required', Rule::in(array_column(PayFrequency::cases(), 'value'))],
            'wage_advance_max_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'default_pension_enabled' => ['nullable', 'boolean'],
            'default_nhf_enabled' => ['nullable', 'boolean'],
            'default_nhis_enabled' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($shop, $validated) {
            if ($shop->taxSettings) {
                $shop->taxSettings->update($validated);
            } else {
                ShopTaxSetting::query()->create([
                    ...$validated,
                    'shop_id' => $shop->id,
                    'tenant_id' => $shop->tenant_id,
                ]);
            }
        });

        return redirect()
            ->back()
            ->with('success', 'Shop settings updated successfully');
    }
}
