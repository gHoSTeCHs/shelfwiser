<?php

namespace App\Http\Controllers;

use App\Http\Requests\Storefront\GenerateVariantMatrixRequest;
use App\Http\Requests\Storefront\StoreProductOptionRequest;
use App\Http\Requests\Storefront\StoreProductOptionValueRequest;
use App\Http\Requests\Storefront\UpdateProductOptionRequest;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Services\VariantMatrixService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProductOptionController extends Controller
{
    public function __construct(
        private readonly VariantMatrixService $matrixService
    ) {}

    public function store(StoreProductOptionRequest $request, Product $product): JsonResponse
    {
        Gate::authorize('create', ProductOption::class);

        $validated = $request->validated();

        $option = DB::transaction(function () use ($product, $validated) {
            $option = $product->options()->create([
                'tenant_id' => $product->tenant_id,
                'name' => $validated['name'],
                'display_name' => $validated['display_name'] ?? null,
                'position' => $validated['position'],
                'visual_type' => $validated['visual_type'],
            ]);

            foreach ($validated['values'] as $valueData) {
                $option->values()->create([
                    'label' => $valueData['label'],
                    'value' => $valueData['value'],
                    'position' => $valueData['position'],
                    'visual_data' => $valueData['visual_data'] ?? null,
                ]);
            }

            return $option;
        });

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

        $validated = $request->validated();

        DB::transaction(function () use ($option, $validated): void {
            $fields = [];
            if (isset($validated['name'])) {
                $fields['name'] = $validated['name'];
            }
            if (array_key_exists('display_name', $validated)) {
                $fields['display_name'] = $validated['display_name'];
            }
            if (isset($validated['position'])) {
                $fields['position'] = $validated['position'];
            }
            if (isset($validated['visual_type'])) {
                $fields['visual_type'] = $validated['visual_type'];
            }

            if (! empty($fields)) {
                $option->update($fields);
            }

            if (isset($validated['values'])) {
                $option->values()->forceDelete();

                foreach ($validated['values'] as $valueData) {
                    $option->values()->create([
                        'label' => $valueData['label'],
                        'value' => $valueData['value'],
                        'position' => $valueData['position'],
                        'visual_data' => $valueData['visual_data'] ?? null,
                    ]);
                }
            }
        });

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

        $option->delete();

        return response()->json([
            'message' => 'Option deleted successfully.',
        ]);
    }

    public function storeValue(StoreProductOptionValueRequest $request, Product $product, ProductOption $option): JsonResponse
    {
        abort_if($option->product_id !== $product->id, 404);
        Gate::authorize('update', $option);

        $validated = $request->validated();

        $value = $option->values()->create([
            'label' => $validated['label'],
            'value' => $validated['value'],
            'position' => $validated['position'],
            'visual_data' => $validated['visual_data'] ?? null,
        ]);

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

        $variantIds = $value->variants()->pluck('product_variants.id');

        $orderCount = DB::table('order_items')
            ->whereIn('product_variant_id', $variantIds)
            ->distinct('order_id')
            ->count('order_id');

        if ($orderCount > 0) {
            return response()->json([
                'message' => "Cannot delete — variants linked to {$orderCount} past order(s). Archive them instead.",
            ], 422);
        }

        DB::transaction(function () use ($value, $variantIds): void {
            if ($variantIds->isNotEmpty()) {
                \App\Models\ProductVariant::query()
                    ->whereIn('id', $variantIds)
                    ->each(function (\App\Models\ProductVariant $variant): void {
                        Gate::authorize('delete', $variant);
                        $variant->delete();
                    });

                DB::table('product_option_value_variant')
                    ->whereIn('product_variant_id', $variantIds)
                    ->delete();
            }

            $value->delete();
        });

        return response()->json([
            'message' => 'Option value deleted successfully.',
        ]);
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
