<?php

namespace App\Http\Controllers;

use App\Exceptions\CannotDeleteException;
use App\Http\Requests\Storefront\GenerateVariantMatrixRequest;
use App\Http\Requests\Storefront\StoreProductOptionRequest;
use App\Http\Requests\Storefront\StoreProductOptionValueRequest;
use App\Http\Requests\Storefront\UpdateProductOptionRequest;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Services\ProductOptionService;
use App\Services\VariantMatrixService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ProductOptionController extends Controller
{
    public function __construct(
        private readonly ProductOptionService $optionService,
        private readonly VariantMatrixService $matrixService
    ) {}

    public function store(StoreProductOptionRequest $request, Product $product): JsonResponse
    {
        Gate::authorize('create', ProductOption::class);

        $option = $this->optionService->createOption($product, $request->validated());
        $option->load('values');

        return response()->json([
            'option' => $option,
            'message' => 'Option created successfully.',
        ], 201);
    }

    public function update(UpdateProductOptionRequest $request, Product $product, ProductOption $option): JsonResponse
    {
        abort_if($option->product_id !== $product->id, 404);
        Gate::authorize('update', $option);

        $option = $this->optionService->updateOption($option, $request->validated());
        $option->load('values');

        return response()->json([
            'option' => $option,
            'message' => 'Option updated successfully.',
        ]);
    }

    public function destroy(Product $product, ProductOption $option): JsonResponse
    {
        abort_if($option->product_id !== $product->id, 404);
        Gate::authorize('delete', $option);

        try {
            $this->optionService->deleteOption($option);
        } catch (CannotDeleteException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Option deleted successfully.']);
    }

    public function storeValue(StoreProductOptionValueRequest $request, Product $product, ProductOption $option): JsonResponse
    {
        abort_if($option->product_id !== $product->id, 404);
        Gate::authorize('update', $option);

        $value = $this->optionService->createOptionValue($option, $request->validated());

        return response()->json([
            'value' => $value,
            'message' => 'Option value added successfully.',
        ], 201);
    }

    public function destroyValue(Product $product, ProductOption $option, ProductOptionValue $value): JsonResponse
    {
        abort_if($option->product_id !== $product->id, 404);
        abort_if($value->product_option_id !== $option->id, 404);
        Gate::authorize('update', $option);

        try {
            $this->optionService->deleteOptionValue($value);
        } catch (CannotDeleteException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Option value deleted successfully.']);
    }

    public function generateMatrix(GenerateVariantMatrixRequest $request, Product $product): JsonResponse
    {
        Gate::authorize('manage', $product);

        $validated = $request->validated();

        $result = $this->matrixService->syncMatrix($product, $validated['option_axes'], $validated['defaults']);

        return response()->json([
            'added' => $result['added'],
            'skipped' => $result['skipped'],
            'message' => "Matrix synced: {$result['added']} variants added, {$result['skipped']} skipped.",
        ]);
    }
}
