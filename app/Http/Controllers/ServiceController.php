<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Shop;
use App\Services\ServiceManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(
        private readonly ServiceManagementService $serviceManagementService
    ) {
    }

    /**
     * Display a listing of services
     */
    public function index(): Response
    {
        Gate::authorize('create', Service::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Services/Index', [
            'services' => Service::where('tenant_id', $tenantId)
                ->with(['category', 'shop', 'variants', 'images' => function ($query) {
                    $query->ordered();
                }])
                ->withCount('variants')
                ->latest()
                ->paginate(20),
        ]);
    }

    /**
     * Show the form for creating a new service
     */
    public function create(): Response
    {
        Gate::authorize('create', Service::class);

        $tenantId = auth()->user()->tenant_id;

        $shops = Shop::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereIn('shop_offering_type', ['services', 'both'])
            ->get(['id', 'name', 'slug', 'shop_offering_type']);

        $categories = ServiceCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'description']);

        return Inertia::render('Services/Create', [
            'shops' => $shops,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created service
     */
    public function store(CreateServiceRequest $request): RedirectResponse
    {
        $shop = Shop::findOrFail($request->input('shop_id'));

        $service = $this->serviceManagementService->create(
            $request->validated(),
            $request->user()->tenant,
            $shop
        );

        return Redirect::route('services.index')
            ->with('success', "Service '{$service->name}' created successfully.");
    }

    /**
     * Display the specified service
     */
    public function show(Service $service): Response
    {
        Gate::authorize('view', $service);

        $service->load([
            'category',
            'shop',
            'variants' => fn($q) => $q->orderBy('sort_order'),
            'addons' => fn($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'images' => function ($query) {
                $query->ordered();
            },
        ]);

        // Get category-wide addons if service has a category
        $categoryAddons = [];
        if ($service->service_category_id) {
            $categoryAddons = \App\Models\ServiceAddon::where('service_category_id', $service->service_category_id)
                ->whereNull('service_id')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        }

        return Inertia::render('Services/Show', [
            'service' => $service,
            'category_addons' => $categoryAddons,
            'can_manage' => auth()->user()->can('manage', $service),
        ]);
    }

    /**
     * Show the form for editing the specified service
     */
    public function edit(Service $service): Response
    {
        Gate::authorize('manage', $service);

        $service->load([
            'category',
            'variants' => fn($q) => $q->orderBy('sort_order'),
            'addons' => fn($q) => $q->orderBy('sort_order'),
            'images' => function ($query) {
                $query->ordered();
            },
        ]);

        $tenantId = auth()->user()->tenant_id;

        $categories = ServiceCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'description']);

        return Inertia::render('Services/Edit', [
            'service' => $service,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified service
     */
    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $this->serviceManagementService->update($service, $request->validated());

        return Redirect::route('services.show', $service)
            ->with('success', "Service '{$service->name}' updated successfully.");
    }

    /**
     * Remove the specified service
     */
    public function destroy(Service $service): RedirectResponse
    {
        Gate::authorize('delete', $service);

        $serviceName = $service->name;

        $this->serviceManagementService->delete($service);

        return Redirect::route('services.index')
            ->with('success', "Service '{$serviceName}' deleted successfully.");
    }
}
