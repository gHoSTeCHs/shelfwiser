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

/**
 * ProductTemplateController
 *
 * Internal/Admin API for product template management and usage.
 *
 * IMPORTANT: This controller is for programmatic access only, NOT exposed in user-facing UI.
 *
 * Methods:
 * - available(): Fetch templates accessible to the current tenant (for template selection UI)
 * - show(): Get full template details with structure
 * - createProduct(): Create a product from a selected template
 * - saveAsTemplate(): Save an existing product as a reusable tenant template
 *
 * Authorization:
 * All methods respect multi-tenancy - templates are filtered by tenant_id or system flag.
 * Product creation requires 'create' policy authorization.
 *
 * Response Format:
 * - GET endpoints return JSON responses
 * - POST endpoints return redirects with success messages
 */
class ProductTemplateController extends Controller
{
    /**
     * Initialize controller with ProductTemplateService.
     */
    public function __construct(
        protected ProductTemplateService $templateService
    ) {}

    /**
     * Get available templates for product creation.
     *
     * Returns templates accessible to the current tenant, optionally filtered by
     * product type or search query. Used by frontend to populate template selection UI.
     *
     * Query Parameters:
     * - search (string): Filter templates by name
     * - product_type_id (int): Filter by product type
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
     *
     * Returns the complete template including its variant structure, custom attributes,
     * and metadata. Verifies the template is accessible to the current tenant.
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
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
     *
     * Instantiates a new product using the specified template, allowing users to
     * override template defaults. Validates all variant and product data before creation.
     *
     * Request Payload:
     * - name (string, optional): Override template product name
     * - description (string, optional): Product description
     * - custom_attributes (array, optional): Custom product attributes
     * - is_active (boolean): Whether product is active
     * - variants (array, required): Variant definitions with prices
     * - variants[*].sku (string): Stock keeping unit
     * - variants[*].price (number, required): Selling price
     * - variants[*].cost_price (number, optional): Cost/wholesale price
     * - variants[*].packaging_types (array, optional): Packaging options and prices
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
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
     *
     * Creates a reusable tenant template from an existing product. This allows operators
     * to capture standardized product configurations for future use. Saved templates are
     * available only to the current tenant.
     *
     * Request Payload:
     * - name (string, required): Template name
     * - description (string, optional): Template description
     * - product_type_id (int, required): Product type for the template
     * - category_id (int, optional): Product category
     * - custom_attributes (array, optional): Custom attributes to include
     * - template_structure (array, required): Variant and field definitions
     * - images (array, optional): Images associated with template
     * - has_variants (boolean): Whether products from this template can have variants
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
