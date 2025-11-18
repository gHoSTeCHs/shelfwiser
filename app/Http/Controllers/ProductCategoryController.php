<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\ProductCategory;
use App\Services\CategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categoryService) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', ProductCategory::class);

        $tenantId = auth()->user()->tenant_id;

        $categories = ProductCategory::where('tenant_id', $tenantId)
            ->whereNull('parent_id')
            ->with(['children' => function ($query) {
                $query->with('children')->withCount('products');
            }])
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', ProductCategory::class);

        $tenantId = auth()->user()->tenant_id;

        $parentCategories = ProductCategory::query()->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Categories/Create', [
            'parentCategories' => $parentCategories,
        ]);
    }

    public function store(CreateCategoryRequest $request): RedirectResponse
    {
        $category = $this->categoryService->create(
            $request->validated(),
            $request->user()->tenant
        );

        return Redirect::route('categories.index')
            ->with('success', "Category '{$category->name}' created successfully.");
    }

    public function show(ProductCategory $category): Response
    {
        Gate::authorize('view', $category);

        $category->load([
            'parent',
            'children' => function ($query) {
                $query->withCount('products');
            },
            'products' => function ($query) {
                $query->with('type', 'shop')->latest()->limit(10);
            },
        ]);

        $category->loadCount('products');

        $breadcrumbs = $this->categoryService->getBreadcrumbs($category);

        return Inertia::render('Categories/Show', [
            'category' => $category,
            'breadcrumbs' => $breadcrumbs,
        ]);
    }

    public function edit(ProductCategory $category): Response
    {
        Gate::authorize('update', $category);

        $tenantId = auth()->user()->tenant_id;

        $category->load('parent', 'children');

        $descendantIds = $this->getDescendantIds($category);
        $excludeIds = array_merge([$category->id], $descendantIds);

        $parentCategories = ProductCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNotIn('id', $excludeIds)
            ->whereNull('parent_id')
            ->with(['children' => function ($query) use ($excludeIds) {
                $query->whereNotIn('id', $excludeIds);
            }])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Categories/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories,
        ]);
    }

    public function update(UpdateCategoryRequest $request, ProductCategory $category): RedirectResponse
    {
        try {
            $category = $this->categoryService->update($category, $request->validated());

            return Redirect::route('categories.show', $category)
                ->with('success', "Category '{$category->name}' updated successfully.");
        } catch (\Exception $e) {
            return Redirect::back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }

    public function destroy(ProductCategory $category): RedirectResponse
    {
        Gate::authorize('delete', $category);

        try {
            $this->categoryService->delete($category);

            return Redirect::route('categories.index')
                ->with('success', 'Category deleted successfully.');
        } catch (\Exception $e) {
            return Redirect::back()
                ->with('error', $e->getMessage());
        }
    }

    protected function getDescendantIds(ProductCategory $category): array
    {
        $descendants = [];

        foreach ($category->children as $child) {
            $descendants[] = $child->id;
            $descendants = array_merge($descendants, $this->getDescendantIds($child));
        }

        return $descendants;
    }
}
