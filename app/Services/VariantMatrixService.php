<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductOptionValue;
use App\Models\ProductVariant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VariantMatrixService
{
    /**
     * Generate all cartesian product combinations from an array of option axes.
     *
     * Each element of $options is an array of option value IDs for one axis.
     * Returns an array of arrays, each inner array being one combination of value IDs.
     *
     * @param  array<int, list<int>>  $options  e.g. [[1,2], [3,4,5]] for two axes
     * @return list<list<int>>
     */
    public function generateCombinations(Product $product, array $options): array
    {
        if (empty($options)) {
            return [];
        }

        $combinations = [[]];

        foreach ($options as $axisValues) {
            $newCombinations = [];

            foreach ($combinations as $existing) {
                foreach ($axisValues as $valueId) {
                    $newCombinations[] = array_merge($existing, [$valueId]);
                }
            }

            $combinations = $newCombinations;
        }

        return $combinations;
    }

    /**
     * Create variants from a set of combinations, attaching pivot records.
     *
     * $combinations is the output of generateCombinations().
     * $defaults provides price/cost_price/stock_quantity applied to every new variant.
     *
     * @param  list<list<int>>  $combinations
     * @param  array{price?: float, cost_price?: float, stock_quantity?: int}  $defaults
     */
    public function createVariantsFromMatrix(
        Product $product,
        array $combinations,
        array $defaults
    ): Collection {
        $created = collect();

        if (empty($combinations)) {
            return $created;
        }

        $optionValues = ProductOptionValue::query()
            ->whereIn('id', array_unique(array_merge(...$combinations)))
            ->with('option')
            ->get()
            ->keyBy('id');

        foreach ($combinations as $valueIds) {
            $labels = collect($valueIds)
                ->map(fn ($id) => $optionValues[$id]?->label)
                ->filter()
                ->values()
                ->join(' / ');

            $slugParts = collect($valueIds)
                ->map(fn ($id) => $optionValues[$id]?->value)
                ->filter()
                ->values()
                ->all();

            $sku = implode('-', array_filter([
                Str::slug($product->name),
                ...$slugParts,
            ]));

            $variant = ProductVariant::query()->create([
                'product_id' => $product->id,
                'sku' => $this->uniqueSku($sku),
                'name' => $labels,
                'price' => $defaults['price'] ?? 0,
                'cost_price' => $defaults['cost_price'] ?? null,
                'is_active' => true,
                'is_available_online' => true,
            ]);

            $variant->optionValues()->attach($valueIds);

            $created->push($variant);
        }

        return $created;
    }

    /**
     * Additive matrix regeneration — adds only new combinations; never deletes existing variants.
     *
     * Returns array with counts of added and skipped variants.
     *
     * @param  array<int, list<int>>  $options  option axes (each axis = list of option value IDs)
     * @param  array{price?: float, cost_price?: float, stock_quantity?: int}  $defaults
     * @return array{added: int, skipped: int}
     */
    public function syncMatrix(Product $product, array $options, array $defaults = []): array
    {
        return DB::transaction(function () use ($product, $options, $defaults): array {
            $allCombinations = $this->generateCombinations($product, $options);

            $existingVariants = $product->variants()
                ->with('optionValues')
                ->get();

            $existingCombinationSets = $existingVariants->map(
                fn ($v) => collect($v->optionValues->pluck('id')->sort()->values())->toArray()
            )->toArray();

            $added = 0;
            $skipped = 0;

            if (! array_key_exists('price', $defaults)) {
                $defaults['price'] = $existingVariants->first()?->price ?? 0;
            }

            $existingHashes = collect($existingCombinationSets)
                ->mapWithKeys(fn ($set) => [implode(',', $set) => true])
                ->all();

            foreach ($allCombinations as $combination) {
                $sorted = collect($combination)->sort()->values()->toArray();
                $hash = implode(',', $sorted);

                if (isset($existingHashes[$hash])) {
                    $skipped++;

                    continue;
                }

                $this->createVariantsFromMatrix($product, [$combination], $defaults);
                $added++;
            }

            return ['added' => $added, 'skipped' => $skipped];
        });
    }

    /**
     * Guard: reject toggling has_variants true → false when multiple active variants exist.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function guardToggleHasVariantsFalse(Product $product): void
    {
        $activeCount = $product->variants()
            ->where('is_active', true)
            ->count();

        if ($activeCount > 1) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'has_variants' => 'Cannot disable variants while multiple active variants exist. Archive extras first, leaving one variant.',
            ]);
        }
    }

    /**
     * Guard: toggle has_variants false → true.
     * Preserves existing default variant as the base; no action needed on the variant itself.
     */
    public function guardToggleHasVariantsTrue(Product $product): void
    {
        // Existing default variant is preserved as-is.
        // The pivot table remains empty for it — options and new matrix variants are added separately.
    }

    private function uniqueSku(string $base): string
    {
        if (! ProductVariant::query()->withTrashed()->where('sku', $base)->exists()) {
            return $base;
        }

        $counter = 1;
        do {
            $candidate = "{$base}-{$counter}";
            $counter++;

            if ($counter > 9999) {
                throw new \RuntimeException("Cannot generate a unique SKU for base: {$base}");
            }
        } while (ProductVariant::query()->withTrashed()->where('sku', $candidate)->exists());

        return $candidate;
    }
}
