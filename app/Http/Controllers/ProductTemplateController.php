<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateProductFromTemplateRequest;
use App\Http\Requests\SaveProductAsTemplateRequest;
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

    public function available(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', ProductTemplate::class);

        $templates = $this->templateService->getAvailableForSelection(
            tenantId: $request->user()->tenant_id,
            search: $request->string('search')->toString() ?: null,
            productTypeId: $request->integer('product_type_id') ?: null,
        );

        return response()->json($templates);
    }

    public function show(ProductTemplate $productTemplate): JsonResponse
    {
        Gate::authorize('view', $productTemplate);

        return response()->json(
            $productTemplate->load(['productType', 'category'])
        );
    }

    public function createProduct(
        CreateProductFromTemplateRequest $request,
        ProductTemplate $productTemplate,
        Shop $shop
    ): RedirectResponse {
        Gate::authorize('createProduct', $productTemplate);
        Gate::authorize('create', [Product::class, $shop]);

        $product = $this->templateService->createProductFromTemplate(
            $productTemplate,
            $shop,
            $request->validated()
        );

        return redirect()
            ->route('products.show', $product)
            ->with('success', 'Product created from template successfully.');
    }

    public function saveAsTemplate(SaveProductAsTemplateRequest $request): RedirectResponse
    {
        Gate::authorize('saveAsTemplate', ProductTemplate::class);

        $template = $this->templateService->create($request->validated(), $request->user()->tenant, $request->user());

        return back()->with('success', "Template '{$template->name}' saved successfully.");
    }
}
