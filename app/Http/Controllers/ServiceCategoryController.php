<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateServiceCategoryRequest;
use App\Http\Requests\UpdateServiceCategoryRequest;
use App\Models\ServiceCategory;
use App\Services\ServiceCategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ServiceCategoryController extends Controller
{
    public function __construct(
        private readonly ServiceCategoryService $serviceCategoryService,
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', ServiceCategory::class);

        return Inertia::render('ServiceCategories/Index', [
            'categories' => $this->serviceCategoryService->getRootCategories(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', ServiceCategory::class);

        return Inertia::render('ServiceCategories/Create', [
            'parentCategories' => $this->serviceCategoryService->getParentCategories(),
        ]);
    }

    public function store(CreateServiceCategoryRequest $request): RedirectResponse
    {
        Gate::authorize('create', ServiceCategory::class);

        $category = $this->serviceCategoryService->createCategory(
            $request->user()->tenant_id,
            $request->validated(),
        );

        return Redirect::route('service-categories.index')
            ->with('success', "Category '$category->name' created successfully.");
    }

    public function edit(ServiceCategory $category): Response
    {
        Gate::authorize('update', $category);

        return Inertia::render('ServiceCategories/Edit', [
            'category' => $category,
            'parentCategories' => $this->serviceCategoryService->getParentCategories($category->id),
        ]);
    }

    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $category): RedirectResponse
    {
        Gate::authorize('update', $category);

        $this->serviceCategoryService->updateCategory($category, $request->validated());

        return Redirect::route('service-categories.index')
            ->with('success', "Category '$category->name' updated successfully.");
    }

    public function destroy(ServiceCategory $category): RedirectResponse
    {
        Gate::authorize('delete', $category);

        $categoryName = $category->name;
        $this->serviceCategoryService->deleteCategory($category);

        return Redirect::route('service-categories.index')
            ->with('success', "Category '$categoryName' deleted successfully.");
    }
}
