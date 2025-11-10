<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateShopRequest;
use App\Models\Shop;
use App\Models\ShopType;
use App\Services\ShopCreationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function __construct(private readonly ShopCreationService $creationService)
    {
    }

    /**
     * Show list of shops (Inertia page)
     */
    public function index(): Response
    {
        Gate::authorize('create', Shop::class);

        $shops = Shop::query()->where('tenant_id', auth()->user()->tenant_id)
            ->with('type', 'users')
            ->latest()
            ->paginate(20);

        return Inertia::render('Shops/Index', [
            'shops' => Shop::query()->where('tenant_id', auth()->user()->tenant_id)
                ->with(['type', 'users'])
                ->withCount('products')
                ->paginate(20),
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
        Gate::authorize('create', Shop::class);

        $shopTypes = ShopType::accessibleTo(auth()->user()->tenant_id)
            ->where('is_active', true)
            ->get(['slug', 'label', 'description', 'config_schema']);

        return Inertia::render('Shops/Create', [
            'shopTypes' => $shopTypes,
        ]);
    }

    /**
     * Store new shop (Inertia POST)
     */
    public function store(CreateShopRequest $request): RedirectResponse
    {
        $shop = $this->creationService->create(
            $request->validated(),
            $request->user()->tenant,
            $request->user()
        );

        return Redirect::route('shops.show', $shop)
            ->with('success', "Shop '$shop->name' created successfully.");
    }

    /**
     * Show single shop (Inertia page)
     */
    public function show(Shop $shop): Response
    {
        Gate::authorize('view', $shop);

        return Inertia::render('Shops/Show', [
            'shop' => $shop->load('type', 'users'),
            'can_manage' => auth()->user()->can('manage', $shop),
        ]);
    }

    /**
     * Update shop (Inertia PUT)
     */
    public function update(Request $request, Shop $shop): RedirectResponse
    {
        Gate::authorize('manage', $shop);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        $shop->update($validated);

        return Redirect::back()
            ->with('success', 'Shop updated successfully.');
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
}
