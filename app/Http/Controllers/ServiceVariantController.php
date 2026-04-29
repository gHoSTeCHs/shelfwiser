<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateServiceVariantRequest;
use App\Http\Requests\UpdateServiceVariantRequest;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Services\ServiceManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;

class ServiceVariantController extends Controller
{
    public function __construct(
        private readonly ServiceManagementService $serviceManagementService
    ) {}

    /**
     * Store a newly created variant
     */
    public function store(CreateServiceVariantRequest $request, Service $service): RedirectResponse
    {
        Gate::authorize('manage', $service);

        $this->serviceManagementService->createVariant($service, $request->validated());

        return Redirect::route('services.show', $service)
            ->with('success', 'Service variant created successfully.');
    }

    /**
     * Update the specified variant
     */
    public function update(
        UpdateServiceVariantRequest $request,
        Service $service,
        ServiceVariant $variant
    ): RedirectResponse {
        abort_unless($variant->service_id === $service->id, 404);
        Gate::authorize('manage', $service);

        $this->serviceManagementService->updateVariant($variant, $request->validated());

        return Redirect::route('services.show', $service)
            ->with('success', 'Service variant updated successfully.');
    }

    /**
     * Remove the specified variant
     */
    public function destroy(Service $service, ServiceVariant $variant): RedirectResponse
    {
        if ($variant->service_id !== $service->id) {
            abort(404);
        }

        Gate::authorize('manage', $service);

        $this->serviceManagementService->deleteVariant($variant);

        return Redirect::route('services.show', $service)
            ->with('success', 'Service variant deleted successfully.');
    }
}
