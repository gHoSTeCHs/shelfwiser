<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateServiceAddonRequest;
use App\Http\Requests\UpdateServiceAddonRequest;
use App\Models\Service;
use App\Models\ServiceAddon;
use App\Models\ServiceCategory;
use App\Services\ServiceManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;

class ServiceAddonController extends Controller
{
    public function __construct(
        private readonly ServiceManagementService $serviceManagementService
    ) {}

    /**
     * Store a newly created addon (service-specific)
     */
    public function store(CreateServiceAddonRequest $request, Service $service): RedirectResponse
    {
        Gate::authorize('manage', $service);

        $this->serviceManagementService->createAddon($request->validated(), $service);

        return Redirect::route('services.show', $service)
            ->with('success', 'Service add-on created successfully.');
    }

    /**
     * Store a newly created addon (category-wide)
     */
    public function storeForCategory(
        CreateServiceAddonRequest $request,
        ServiceCategory $category
    ): RedirectResponse {
        Gate::authorize('create', Service::class);

        $this->serviceManagementService->createAddon($request->validated(), null, $category);

        return Redirect::back()
            ->with('success', 'Category-wide add-on created successfully.');
    }

    /**
     * Update the specified addon
     */
    public function update(UpdateServiceAddonRequest $request, ServiceAddon $addon): RedirectResponse
    {
        $addon->loadMissing('service');

        if ($addon->service_id) {
            Gate::authorize('manage', $addon->service);
        } else {
            Gate::authorize('create', Service::class);
        }

        $this->serviceManagementService->updateAddon($addon, $request->validated());

        if ($addon->service_id) {
            return Redirect::route('services.show', $addon->service)
                ->with('success', 'Add-on updated successfully.');
        }

        return Redirect::back()
            ->with('success', 'Add-on updated successfully.');
    }

    /**
     * Remove the specified addon
     */
    public function destroy(ServiceAddon $addon): RedirectResponse
    {
        $addon->loadMissing('service');

        if ($addon->service_id) {
            Gate::authorize('manage', $addon->service);
        } else {
            Gate::authorize('create', Service::class);
        }

        $this->serviceManagementService->deleteAddon($addon);

        if ($addon->service_id) {
            return Redirect::route('services.show', $addon->service)
                ->with('success', 'Add-on deleted successfully.');
        }

        return Redirect::back()
            ->with('success', 'Add-on deleted successfully.');
    }
}
