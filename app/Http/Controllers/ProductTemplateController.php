<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductTemplate;
use App\Models\Shop;
use App\Services\ProductTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProductTemplateController extends Controller
{
    public function __construct(
        protected ProductTemplateService $templateService
    ) {}

    /**
     * Get available templates for product creation.
     */
    public function available(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $templates = ProductTemplate::with(['productType', 'category'])
            ->availableFor($tenantId)
            ->active()
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->when($request->product_type_id, function ($q, $typeId) {
                $q->where('product_type_id', $typeId);
            })
            ->orderBy('name')
            ->limit(50)
            ->get();

        return response()->json($templates);
    }

    /**
     * Get a specific template with full structure.
     */
    public function show(ProductTemplate $productTemplate): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        if (! $productTemplate->is_system && $productTemplate->tenant_id !== $tenantId) {
            abort(403);
        }

        return response()->json(
            $productTemplate->load(['productType', 'category'])
        );
    }

    /**
     * Create a product from a template.
     */
    public function createProduct(Request $request, ProductTemplate $productTemplate, Shop $shop): RedirectResponse
    {
        Gate::authorize('create', [Product::class, $shop]);

        $tenantId = auth()->user()->tenant_id;

        if (! $productTemplate->is_system && $productTemplate->tenant_id !== $tenantId) {
            abort(403);
        }

        if ($shop->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'custom_attributes' => 'nullable|array',
            'is_active' => 'boolean',
            'variants' => 'required|array',
            'variants.*.sku' => 'nullable|string|unique:product_variants,sku',
            'variants.*.barcode' => 'nullable|string',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.cost_price' => 'nullable|numeric|min:0',
            'variants.*.packaging_types' => 'nullable|array',
            'variants.*.packaging_types.*.price' => 'nullable|numeric|min:0',
        ]);

        $product = $this->templateService->createProductFromTemplate(
            $productTemplate,
            $shop,
            $validated
        );

        return redirect()
            ->route('products.show', $product)
            ->with('success', 'Product created from template successfully.');
    }

    /**
     * Save current product as a template (tenant template).
     */
    public function saveAsTemplate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_type_id' => 'required|exists:product_types,id',
            'category_id' => 'nullable|exists:product_categories,id',
            'custom_attributes' => 'nullable|array',
            'template_structure' => 'required|array',
            'images' => 'nullable|array',
            'has_variants' => 'boolean',
        ]);

        $tenant = auth()->user()->tenant;

        $template = $this->templateService->create($validated, $tenant);

        return back()->with('success', "Template '{$template->name}' saved successfully.");
    }
}
