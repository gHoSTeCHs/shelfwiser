<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminProductTemplateRequest;
use App\Http\Requests\Admin\UpdateAdminProductTemplateRequest;
use App\Models\ProductTemplate;
use App\Services\ProductTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminProductTemplateController extends Controller
{
    public function __construct(
        protected ProductTemplateService $templateService
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('admin.tenants.viewAny');

        $templates = $this->templateService->getAvailableTemplates(
            tenantId: null,
            filters: array_merge($request->only(['search', 'product_type_id', 'category_id', 'sort', 'direction']), [
                'is_system' => true,
            ])
        );

        return Inertia::render('Admin/ProductTemplates/Index', [
            'templates' => $templates,
            'filters' => $request->only(['search', 'product_type_id', 'category_id', 'sort', 'direction']),
            'statistics' => $this->templateService->getStatistics(),
            ...$this->templateService->getAdminFormOptions(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('admin.tenants.viewAny');

        return Inertia::render('Admin/ProductTemplates/Create', $this->templateService->getAdminFormOptions());
    }

    public function store(StoreAdminProductTemplateRequest $request): RedirectResponse
    {
        Gate::authorize('admin.product-templates.create');

        $template = $this->templateService->create([
            ...$request->validated(),
            'is_system' => true,
        ], actor: $request->user());

        return redirect()
            ->route('admin.product-templates.show', $template)
            ->with('success', 'Product template created successfully.');
    }

    public function show(ProductTemplate $productTemplate): Response
    {
        Gate::authorize('admin.tenants.viewAny');

        $productTemplate->load(['productType', 'category', 'createdBy']);

        return Inertia::render('Admin/ProductTemplates/Show', [
            'template' => $productTemplate,
            'usageCount' => $productTemplate->usage_count,
        ]);
    }

    public function edit(ProductTemplate $productTemplate): Response
    {
        Gate::authorize('admin.tenants.viewAny');

        return Inertia::render('Admin/ProductTemplates/Edit', [
            'template' => $productTemplate->load(['productType', 'category']),
            ...$this->templateService->getAdminFormOptions(),
        ]);
    }

    public function update(UpdateAdminProductTemplateRequest $request, ProductTemplate $productTemplate): RedirectResponse
    {
        Gate::authorize('admin.product-templates.update');

        $this->templateService->update($productTemplate, $request->validated());

        return redirect()
            ->route('admin.product-templates.show', $productTemplate)
            ->with('success', 'Product template updated successfully.');
    }

    public function destroy(ProductTemplate $productTemplate): RedirectResponse
    {
        Gate::authorize('admin.product-templates.delete');

        try {
            $this->templateService->delete($productTemplate);
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('admin.product-templates.index')
            ->with('success', 'Product template deleted successfully.');
    }
}
