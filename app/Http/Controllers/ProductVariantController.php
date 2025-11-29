<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProductVariantRequest;
use App\Models\ProductVariant;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProductVariantController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {
    }

    /**
     * Show the form for editing the specified variant
     */
    public function edit(ProductVariant $variant): Response
    {
        Gate::authorize('update', $variant);

        $variant->load(['product', 'packagingTypes']);

        return Inertia::render('Products/Variants/Edit', [
            'variant' => $variant,
            'product' => $variant->product,
        ]);
    }

    /**
     * Update the specified variant
     */
    public function update(UpdateProductVariantRequest $request, ProductVariant $variant): RedirectResponse
    {
        $this->productService->updateVariant($variant, $request->validated());

        return Redirect::route('products.show', $variant->product_id)
            ->with('success', 'Variant updated successfully.');
    }
}
