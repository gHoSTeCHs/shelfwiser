<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use App\Models\Shop;
use App\Services\ServiceManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ServiceController extends Controller
{
    public function __construct(
        private readonly ServiceManagementService $serviceManagementService
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Service::class);

        return Inertia::render('Services/Index', [
            'services' => $this->serviceManagementService->getPaginatedServices(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Service::class);

        return Inertia::render('Services/Create', [
            'shops' => $this->serviceManagementService->getShopsForForm(),
            'categories' => $this->serviceManagementService->getCategoriesForForm(),
        ]);
    }

    /**
     * @throws Throwable
     */
    public function store(CreateServiceRequest $request): RedirectResponse
    {
        Gate::authorize('create', Service::class);

        $shop = Shop::query()->findOrFail($request->validated()['shop_id']);

        $service = $this->serviceManagementService->create(
            $request->validated(),
            $request->user()->tenant,
            $shop
        );

        return Redirect::route('services.index')
            ->with('success', "Service '$service->name' created successfully.");
    }

    public function show(Service $service): Response
    {
        Gate::authorize('view', $service);

        $service->load([
            'category',
            'shop',
            'variants' => fn ($q) => $q->orderBy('sort_order'),
            'addons' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'images' => fn ($q) => $q->ordered(),
        ]);

        return Inertia::render('Services/Show', [
            'service' => $service,
            'category_addons' => $this->serviceManagementService->getCategoryAddons($service->service_category_id),
            'can_manage' => auth()->user()->can('manage', $service),
        ]);
    }

    public function edit(Service $service): Response
    {
        Gate::authorize('manage', $service);

        $service->load([
            'category',
            'variants' => fn ($q) => $q->orderBy('sort_order'),
            'addons' => fn ($q) => $q->orderBy('sort_order'),
            'images' => fn ($q) => $q->ordered(),
        ]);

        return Inertia::render('Services/Edit', [
            'service' => $service,
            'categories' => $this->serviceManagementService->getCategoriesForForm(),
        ]);
    }

    /**
     * @throws Throwable
     */
    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        Gate::authorize('manage', $service);

        $this->serviceManagementService->update($service, $request->validated());

        return Redirect::route('services.show', $service)
            ->with('success', "Service '$service->name' updated successfully.");
    }

    /**
     * @throws Throwable
     */
    public function destroy(Service $service): RedirectResponse
    {
        Gate::authorize('delete', $service);

        $serviceName = $service->name;

        $this->serviceManagementService->delete($service);

        return Redirect::route('services.index')
            ->with('success', "Service '$serviceName' deleted successfully.");
    }
}
