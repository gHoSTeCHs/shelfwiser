<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExtendSubscriptionRequest;
use App\Http\Requests\Admin\IndexTenantRequest;
use App\Http\Requests\Admin\StoreTenantRequest;
use App\Http\Requests\Admin\UpdateTenantLimitsRequest;
use App\Http\Requests\Admin\UpdateTenantRequest;
use App\Models\Tenant;
use App\Services\AdminTenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminTenantController extends Controller
{
    public function __construct(
        private readonly AdminTenantService $tenantService,
    ) {}

    public function index(IndexTenantRequest $request): Response
    {
        Gate::authorize('admin.tenants.viewAny');

        return Inertia::render('Admin/Tenants/Index', [
            'tenants' => $this->tenantService->getPaginatedTenants($request->filters()),
            'filters' => $request->only(['search', 'plan', 'is_active']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('admin.tenants.create');

        return Inertia::render('Admin/Tenants/Create', [
            'subscriptionPlans' => $this->tenantService->getSubscriptionPlans(),
        ]);
    }

    public function store(StoreTenantRequest $request): RedirectResponse
    {
        Gate::authorize('admin.tenants.create');

        $tenant = $this->tenantService->createTenant($request->validated());

        return redirect()
            ->route('admin.tenants.show', $tenant)
            ->with('success', 'Tenant created successfully.');
    }

    public function show(Tenant $tenant): Response
    {
        Gate::authorize('admin.tenants.view');

        return Inertia::render('Admin/Tenants/Show', [
            'tenant' => $this->tenantService->getTenantDetails($tenant),
        ]);
    }

    public function edit(Tenant $tenant): Response
    {
        Gate::authorize('admin.tenants.update');

        return Inertia::render('Admin/Tenants/Edit', [
            'tenant' => $this->tenantService->getTenantForEdit($tenant),
            'subscriptionPlans' => $this->tenantService->getSubscriptionPlans(),
        ]);
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant): RedirectResponse
    {
        Gate::authorize('admin.tenants.update');

        $this->tenantService->updateTenant($tenant, $request->validated());

        return redirect()
            ->route('admin.tenants.show', $tenant)
            ->with('success', 'Tenant updated successfully.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        Gate::authorize('admin.tenants.delete');

        $this->tenantService->deleteTenant($tenant);

        return redirect()
            ->route('admin.tenants.index')
            ->with('success', 'Tenant deleted successfully.');
    }

    public function toggleActive(Tenant $tenant): RedirectResponse
    {
        Gate::authorize('admin.tenants.update');

        $isActive = $this->tenantService->toggleActive($tenant);

        return back()->with('success', 'Tenant '.($isActive ? 'activated' : 'deactivated').' successfully.');
    }

    public function extendSubscription(ExtendSubscriptionRequest $request, Tenant $tenant): RedirectResponse
    {
        Gate::authorize('admin.tenants.update');

        $days = (int) $request->validated('days');
        $this->tenantService->extendSubscription($tenant, $days);

        return back()->with('success', "Subscription extended by {$days} days.");
    }

    public function updateLimits(UpdateTenantLimitsRequest $request, Tenant $tenant): RedirectResponse
    {
        Gate::authorize('admin.tenants.update');

        $this->tenantService->updateLimits($tenant, $request->validated());

        return back()->with('success', 'Tenant limits updated successfully.');
    }
}
