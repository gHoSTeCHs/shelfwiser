<?php

namespace App\Services;

use App\Exceptions\CannotDeleteException;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class ProductOptionService
{
    public function createOption(Product $product, array $validated): ProductOption
    {
        return DB::transaction(function () use ($product, $validated): ProductOption {
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
    }

    public function updateOption(ProductOption $option, array $validated): ProductOption
    {
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

        return $option;
    }

    /**
     * @throws CannotDeleteException
     */
    public function deleteOption(ProductOption $option): void
    {
        $valueIds = $option->values()->pluck('id');

        if ($valueIds->isEmpty()) {
            $option->delete();

            return;
        }

        DB::transaction(function () use ($option, $valueIds): void {
            $variantIds = DB::table('product_option_value_variant')
                ->whereIn('product_option_value_id', $valueIds)
                ->distinct()
                ->pluck('product_variant_id');

            if ($variantIds->isNotEmpty()) {
                ProductVariant::query()->whereIn('id', $variantIds)->lockForUpdate()->get();

                $orderCount = DB::table('order_items')
                    ->whereIn('product_variant_id', $variantIds)
                    ->distinct('order_id')
                    ->count('order_id');

                if ($orderCount > 0) {
                    throw new CannotDeleteException(
                        "Cannot delete — variants linked to {$orderCount} past order(s). Archive them instead."
                    );
                }

                ProductVariant::query()
                    ->whereIn('id', $variantIds)
                    ->each(fn (ProductVariant $variant) => $variant->delete());

                DB::table('product_option_value_variant')
                    ->whereIn('product_variant_id', $variantIds)
                    ->delete();
            }

            $option->values()->each(fn ($value) => $value->delete());
            $option->delete();
        });
    }

    public function createOptionValue(ProductOption $option, array $validated): ProductOptionValue
    {
        return $option->values()->create([
            'label' => $validated['label'],
            'value' => $validated['value'],
            'position' => $validated['position'],
            'visual_data' => $validated['visual_data'] ?? null,
        ]);
    }

    /**
     * @throws CannotDeleteException
     */
    public function deleteOptionValue(ProductOptionValue $value): void
    {
        DB::transaction(function () use ($value): void {
            $variantIds = $value->variants()->pluck('product_variants.id');

            if ($variantIds->isNotEmpty()) {
                ProductVariant::query()->whereIn('id', $variantIds)->lockForUpdate()->get();

                $orderCount = DB::table('order_items')
                    ->whereIn('product_variant_id', $variantIds)
                    ->distinct('order_id')
                    ->count('order_id');

                if ($orderCount > 0) {
                    throw new CannotDeleteException(
                        "Cannot delete — variants linked to {$orderCount} past order(s). Archive them instead."
                    );
                }

                ProductVariant::query()
                    ->whereIn('id', $variantIds)
                    ->each(fn (ProductVariant $variant) => $variant->delete());

                DB::table('product_option_value_variant')
                    ->whereIn('product_variant_id', $variantIds)
                    ->delete();
            }

            $value->delete();
        });
    }
}
