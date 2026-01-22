<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Models\InventoryLocation;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Services\StockMovementService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StockTakeController extends Controller
{
    public function __construct(
        private readonly StockMovementService $stockMovementService
    ) {}

    public function index(Shop $shop): Response
    {
        Gate::authorize('manage', $shop);

        $tenantId = auth()->user()->tenant_id;

        $variants = ProductVariant::whereHas('product', function ($query) use ($shop, $tenantId) {
            $query->where('tenant_id', $tenantId)
                ->where('shop_id', $shop->id)
                ->where('is_active', true);
        })
            ->with([
                'product:id,name,sku',
                'inventoryLocations' => function ($query) use ($shop) {
                    $query->where('location_type', 'App\\Models\\Shop')
                        ->where('location_id', $shop->id);
                },
            ])
            ->where('is_active', true)
            ->orderBy('sku')
            ->get();

        $variantsWithStock = $variants->map(function ($variant) use ($shop) {
            $location = $variant->inventoryLocations->first();

            return [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'name' => $variant->name,
                'product_name' => $variant->product->name,
                'system_count' => $location?->quantity ?? 0,
                'physical_count' => null,
                'location_id' => $location?->id,
            ];
        });

        return Inertia::render('StockTake/Index', [
            'shop' => $shop,
            'variants' => $variantsWithStock,
        ]);
    }

    public function store(Request $request, Shop $shop): RedirectResponse
    {
        Gate::authorize('manage', $shop);

        $validated = $request->validate([
            'counts' => 'required|array',
            'counts.*.variant_id' => 'required|exists:product_variants,id',
            'counts.*.location_id' => 'required|exists:inventory_locations,id',
            'counts.*.physical_count' => 'required|integer|min:0',
            'counts.*.system_count' => 'required|integer',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $adjustments = [];

            DB::transaction(function () use ($validated, $shop, &$adjustments) {
                foreach ($validated['counts'] as $count) {
                    $variant = ProductVariant::findOrFail($count['variant_id']);
                    $location = InventoryLocation::findOrFail($count['location_id']);

                    $systemCount = (int) $count['system_count'];
                    $physicalCount = (int) $count['physical_count'];
                    $difference = $physicalCount - $systemCount;

                    if ($difference !== 0) {
                        // Use absolute value for quantity, type determines direction
                        $quantity = abs($difference);
                        $type = $difference > 0
                            ? StockMovementType::ADJUSTMENT_IN
                            : StockMovementType::ADJUSTMENT_OUT;

                        $reason = "Stock take adjustment - Physical count: {$physicalCount}, System count: {$systemCount}";
                        $notes = $validated['notes'] ?? "Stock take conducted";

                        $movement = $this->stockMovementService->adjustStock(
                            $variant,
                            $location,
                            $quantity,
                            $type,
                            auth()->user(),
                            $reason,
                            $notes
                        );

                        $adjustments[] = [
                            'variant' => $variant->sku,
                            'difference' => $difference,
                            'movement_id' => $movement->id,
                        ];
                    }
                }
            });

            $message = count($adjustments) > 0
                ? 'Stock take completed. ' . count($adjustments) . ' adjustment(s) made.'
                : 'Stock take completed. No adjustments needed.';

            return redirect()
                ->route('shops.show', $shop)
                ->with('success', $message);
        } catch (Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Stock take failed: ' . $e->getMessage());
        }
    }
}
