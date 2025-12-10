<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProductVariantRequest;
use App\Models\ProductVariant;
use App\Services\BarcodeGeneratorService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProductVariantController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly BarcodeGeneratorService $barcodeGenerator
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

    /**
     * Generate a barcode for the specified variant
     */
    public function generateBarcode(ProductVariant $variant): JsonResponse
    {
        Gate::authorize('update', $variant);

        try {
            $variant->load('product');
            $barcode = $this->barcodeGenerator->generateAndAssign($variant);

            return response()->json([
                'success' => true,
                'barcode' => $barcode,
                'message' => 'Barcode generated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Batch generate barcodes for multiple variants
     */
    public function batchGenerateBarcodes(Request $request): JsonResponse
    {
        $request->validate([
            'variant_ids' => 'required|array',
            'variant_ids.*' => 'exists:product_variants,id',
        ]);

        // Verify authorization for all variants
        $variants = ProductVariant::with('product')->whereIn('id', $request->variant_ids)->get();

        foreach ($variants as $variant) {
            Gate::authorize('update', $variant);
        }

        $results = $this->barcodeGenerator->batchGenerate($request->variant_ids);

        $successCount = count(array_filter($results, fn($b) => $b !== null));
        $failedCount = count($results) - $successCount;

        return response()->json([
            'success' => true,
            'results' => $results,
            'message' => "Generated {$successCount} barcodes" . ($failedCount > 0 ? ", {$failedCount} failed" : ''),
        ]);
    }
}
