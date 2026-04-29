<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminSettingsRequest;
use App\Services\AdminSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __construct(
        private AdminSettingsService $adminSettingsService
    ) {}

    public function index(): Response
    {
        Gate::authorize('admin.tenants.viewAny');

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $this->adminSettingsService->getSystemSettings(),
            'stats' => $this->adminSettingsService->getSystemStats(),
        ]);
    }

    public function update(UpdateAdminSettingsRequest $request): RedirectResponse
    {
        Gate::authorize('admin.tenants.update');

        $this->adminSettingsService->updateSystemSettings($request->validated());

        return redirect()
            ->route('admin.settings.index')
            ->with('success', 'Settings updated successfully.');
    }

    public function clearCache(): RedirectResponse
    {
        Gate::authorize('admin.tenants.viewAny');

        $this->adminSettingsService->clearCache();

        return redirect()
            ->route('admin.settings.index')
            ->with('success', 'Cache cleared successfully.');
    }
}
