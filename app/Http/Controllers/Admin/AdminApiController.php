<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreApiKeyRequest;
use App\Services\AdminApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminApiController extends Controller
{
    public function __construct(
        private readonly AdminApiService $adminApiService
    ) {}

    public function index(): Response
    {
        Gate::authorize('admin.api.viewAny');

        return Inertia::render('Admin/Api/Index', [
            'apiKeys' => $this->adminApiService->getApiKeys(),
            'stats' => $this->adminApiService->getStats(),
            'webhooks' => [],
            'rateLimits' => $this->adminApiService->getRateLimits(),
        ]);
    }

    public function store(StoreApiKeyRequest $request): RedirectResponse
    {
        Gate::authorize('admin.api.create');

        $this->adminApiService->createApiKey($request->validated());

        return redirect()
            ->route('admin.api.index')
            ->with('success', 'API key created successfully.');
    }

    public function destroy(string $id): RedirectResponse
    {
        Gate::authorize('admin.api.delete');

        $this->adminApiService->revokeApiKey($id);

        return redirect()
            ->route('admin.api.index')
            ->with('success', 'API key revoked successfully.');
    }
}
