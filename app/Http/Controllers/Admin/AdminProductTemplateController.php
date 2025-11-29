<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use App\Models\ProductTemplate;
use App\Models\ProductType;
use App\Services\ProductTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminProductTemplateController extends Controller
{
    public function __construct(
        protected ProductTemplateService $templateService
    ) {}

    /**
     * Display listing of system product templates.
     */
    public function index(Request $request): Response
    {
        $templates = $this->templateService->getAvailableTemplates(
            tenantId: null,
            filters: array_merge($request->only(['search', 'product_type_id', 'category_id', 'sort', 'direction']), [
                'is_system' => true,
            ])
        );

        return Inertia::render('Admin/ProductTemplates/Index', [
            'templates' => $templates,
            'productTypes' => ProductType::orderBy('label')->get(),
            'categories' => ProductCategory::whereNull('tenant_id')->orderBy('name')->get(),
            'filters' => $request->only(['search', 'product_type_id', 'category_id', 'sort', 'direction']),
            'statistics' => $this->templateService->getStatistics(),
        ]);
    }

    /**
     * Show form for creating a new system template.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/ProductTemplates/Create', [
            'productTypes' => ProductType::orderBy('label')->get(),
            'categories' => ProductCategory::whereNull('tenant_id')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a new system template.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_type_id' => 'required|exists:product_types,id',
            'category_id' => 'nullable|exists:product_categories,id',
            'custom_attributes' => 'nullable|array',
            'template_structure' => 'required|array',
            'template_structure.variants' => 'required|array|min:1',
            'template_structure.variants.*.name' => 'required|string',
            'template_structure.variants.*.attributes' => 'nullable|array',
            'template_structure.variants.*.packaging_types' => 'nullable|array',
            'images' => 'nullable|array',
            'seo_metadata' => 'nullable|array',
            'has_variants' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['is_system'] = true;

        $template = $this->templateService->create($validated);

        return redirect()
            ->route('admin.product-templates.show', $template)
            ->with('success', 'Product template created successfully.');
    }

    /**
     * Display a specific template.
     */
    public function show(ProductTemplate $productTemplate): Response
    {
        $productTemplate->load(['productType', 'category', 'createdBy']);

        return Inertia::render('Admin/ProductTemplates/Show', [
            'template' => $productTemplate,
            'usageCount' => $productTemplate->usage_count,
        ]);
    }

    /**
     * Show form for editing a template.
     */
    public function edit(ProductTemplate $productTemplate): Response
    {
        return Inertia::render('Admin/ProductTemplates/Edit', [
            'template' => $productTemplate->load(['productType', 'category']),
            'productTypes' => ProductType::orderBy('label')->get(),
            'categories' => ProductCategory::whereNull('tenant_id')->orderBy('name')->get(),
        ]);
    }

    /**
     * Update a template.
     */
    public function update(Request $request, ProductTemplate $productTemplate): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_type_id' => 'required|exists:product_types,id',
            'category_id' => 'nullable|exists:product_categories,id',
            'custom_attributes' => 'nullable|array',
            'template_structure' => 'required|array',
            'template_structure.variants' => 'required|array|min:1',
            'images' => 'nullable|array',
            'seo_metadata' => 'nullable|array',
            'has_variants' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $this->templateService->update($productTemplate, $validated);

        return redirect()
            ->route('admin.product-templates.show', $productTemplate)
            ->with('success', 'Product template updated successfully.');
    }

    /**
     * Delete a template.
     */
    public function destroy(ProductTemplate $productTemplate): RedirectResponse
    {
        if ($productTemplate->usage_count > 0) {
            return back()->with('error', 'Cannot delete template that has been used to create products.');
        }

        $this->templateService->delete($productTemplate);

        return redirect()
            ->route('admin.product-templates.index')
            ->with('success', 'Product template deleted successfully.');
    }
}
