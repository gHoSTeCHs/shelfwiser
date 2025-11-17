<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateServiceCategoryRequest;
use App\Http\Requests\UpdateServiceCategoryRequest;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ServiceCategoryController extends Controller
{
    /**
     * Display a listing of service categories
     */
    public function index(): Response
    {
        Gate::authorize('create', Service::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceCategories/Index', [
            'categories' => ServiceCategory::query()->where('tenant_id', $tenantId)
                ->whereNull('parent_id')
                ->with(['children' => fn($q) => $q->orderBy('sort_order')])
                ->withCount('services')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    /**
     * Show the form for creating a new category
     */
    public function create(): Response
    {
        Gate::authorize('create', Service::class);

        $tenantId = auth()->user()->tenant_id;

        $parentCategories = ServiceCategory::where('tenant_id', $tenantId)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('ServiceCategories/Create', [
            'parentCategories' => $parentCategories,
        ]);
    }

    /**
     * Store a newly created category
     */
    public function store(CreateServiceCategoryRequest $request): RedirectResponse
    {
        $category = ServiceCategory::query()->create([
            'tenant_id' => $request->user()->tenant_id,
            ...$request->validated(),
        ]);

        return Redirect::route('service-categories.index')
            ->with('success', "Category '$category->name' created successfully.");
    }

    /**
     * Show the form for editing the specified category
     */
    public function edit(ServiceCategory $category): Response
    {
        Gate::authorize('create', Service::class);

        // Ensure category belongs to user's tenant
        if ($category->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        $parentCategories = ServiceCategory::query()->where('tenant_id', $tenantId)
            ->whereNull('parent_id')
            ->where('id', '!=', $category->id) // Don't allow selecting self as parent
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('ServiceCategories/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories,
        ]);
    }

    /**
     * Update the specified category
     */
    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $category): RedirectResponse
    {
        // Ensure category belongs to user's tenant
        if ($category->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $category->update($request->validated());

        return Redirect::route('service-categories.index')
            ->with('success', "Category '$category->name' updated successfully.");
    }

    /**
     * Remove the specified category
     */
    public function destroy(ServiceCategory $category): RedirectResponse
    {
        Gate::authorize('create', Service::class);

        // Ensure category belongs to user's tenant
        if ($category->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $categoryName = $category->name;
        $category->delete();

        return Redirect::route('service-categories.index')
            ->with('success', "Category '$categoryName' deleted successfully.");
    }
}
