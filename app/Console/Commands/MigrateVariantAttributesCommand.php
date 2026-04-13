<?php

namespace App\Console\Commands;

use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\ProductVariant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MigrateVariantAttributesCommand extends Command
{
    protected $signature = 'products:migrate-variant-attributes
                            {--dry-run : Preview changes without persisting them}
                            {--tenant= : Restrict migration to a single tenant ID}';

    protected $description = 'Migrate variant attributes JSON into the product_options / product_option_values pivot schema';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $tenantFilter = $this->option('tenant');

        $query = ProductVariant::query()
            ->whereNotNull('attributes')
            ->with('product');

        if ($tenantFilter) {
            $query->whereHas('product', fn ($q) => $q->where('tenant_id', (int) $tenantFilter));
        }

        $total = $query->count();

        if ($total === 0) {
            $this->info('No variants with attributes JSON found. Nothing to migrate.');

            return self::SUCCESS;
        }

        $this->info("Found {$total} variants with attributes. Processing...");

        $migrated = 0;
        $skipped = 0;

        $query->chunkById(200, function ($variants) use (&$migrated, &$skipped, $isDryRun): void {
            foreach ($variants as $variant) {
                $attributes = is_array($variant->attributes)
                    ? $variant->attributes
                    : json_decode($variant->attributes, true);

                if (empty($attributes)) {
                    $skipped++;

                    continue;
                }

                if ($variant->optionValues()->exists()) {
                    $this->line("  Skip variant #{$variant->id} — already has option value pivot records.");
                    $skipped++;

                    continue;
                }

                $this->line("  Processing variant #{$variant->id}: ".json_encode($attributes));

                if ($isDryRun) {
                    $migrated++;

                    continue;
                }

                DB::transaction(function () use ($variant, $attributes): void {
                    $product = $variant->product;
                    $valueIds = [];
                    $position = 0;

                    foreach ($attributes as $optionName => $optionValue) {
                        $option = ProductOption::query()
                            ->where('product_id', $product->id)
                            ->where('name', $optionName)
                            ->first();

                        if (! $option) {
                            $option = ProductOption::query()->create([
                                'product_id' => $product->id,
                                'tenant_id' => $product->tenant_id,
                                'name' => $optionName,
                                'position' => $position,
                                'visual_type' => 'button_group',
                            ]);
                        }

                        $valueSlug = Str::slug((string) $optionValue);

                        $value = ProductOptionValue::query()
                            ->where('product_option_id', $option->id)
                            ->where('value', $valueSlug)
                            ->first();

                        if (! $value) {
                            $value = ProductOptionValue::query()->create([
                                'product_option_id' => $option->id,
                                'label' => (string) $optionValue,
                                'value' => $valueSlug,
                                'position' => $option->values()->count(),
                            ]);
                        }

                        $valueIds[] = $value->id;
                        $position++;
                    }

                    $variant->optionValues()->sync($valueIds);
                });

                $migrated++;
            }
        });

        $label = $isDryRun ? '[DRY RUN] Would migrate' : 'Migrated';
        $this->info("{$label} {$migrated} variants. Skipped {$skipped}.");

        return self::SUCCESS;
    }
}
