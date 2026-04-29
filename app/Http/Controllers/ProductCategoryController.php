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

        return Inertia::render('Categories/Index', [
            'categories' => $this->categoryService->getCategoriesForIndex(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', ProductCategory::class);

        return Inertia::render('Categories/Create', [
            'parentCategories' => $this->categoryService->getParentCategoriesForForm(),
        ]);
    }

    public function store(CreateCategoryRequest $request): RedirectResponse
    {
        Gate::authorize('create', ProductCategory::class);

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

        return Inertia::render('Categories/Show', [
            'category' => $category,
            'breadcrumbs' => $this->categoryService->getBreadcrumbs($category),
        ]);
    }

    public function edit(ProductCategory $category): Response
    {
        Gate::authorize('update', $category);

        $category->load('parent', 'children');

        return Inertia::render('Categories/Edit', [
            'category' => $category,
            'parentCategories' => $this->categoryService->getParentCategoriesForForm($category),
        ]);
    }

    public function update(UpdateCategoryRequest $request, ProductCategory $category): RedirectResponse
    {
        Gate::authorize('update', $category);

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
}
