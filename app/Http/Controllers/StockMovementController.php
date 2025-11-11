<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\StockTakeRequest;
use App\Http\Requests\TransferStockRequest;
use App\Models\InventoryLocation;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Services\StockMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    public function __construct(private readonly StockMovementService $stockMovementService)
    {
    }

    public function index(): Response
    {
        Gate::authorize('viewAny', StockMovement::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('StockMovements/Index', [
            'movements' => StockMovement::where('tenant_id', $tenantId)
                ->with([
                    'productVariant.product',
                    'fromLocation.locatable',
                    'toLocation.locatable',
                    'createdBy:id,name',
                ])
                ->latest()
                ->paginate(50),
            'movementTypes' => StockMovementType::forSelect(),
        ]);
    }

    public function show(StockMovement $stockMovement): Response
    {
        Gate::authorize('view', $stockMovement);

        $stockMovement->load([
            'productVariant.product',
            'fromLocation.locatable',
            'toLocation.locatable',
            'createdBy',
        ]);

        return Inertia::render('StockMovements/Show', [
            'movement' => $stockMovement,
        ]);
    }

    public function adjustStock(AdjustStockRequest $request): RedirectResponse|JsonResponse
    {
        try {
            $variant = ProductVariant::findOrFail($request->input('product_variant_id'));
            $location = InventoryLocation::findOrFail($request->input('inventory_location_id'));
            $type = StockMovementType::from($request->input('type'));

            $movement = $this->stockMovementService->adjustStock(
                variant: $variant,
                location: $location,
                quantity: $request->input('quantity'),
                type: $type,
                user: $request->user(),
                reason: $request->input('reason'),
                notes: $request->input('notes')
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Stock adjusted successfully.',
                    'movement' => $movement->load(['productVariant', 'toLocation']),
                ]);
            }

            return Redirect::back()->with('success', 'Stock adjusted successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function transferStock(TransferStockRequest $request): RedirectResponse|JsonResponse
    {
        try {
            $variant = ProductVariant::findOrFail($request->input('product_variant_id'));
            $fromLocation = InventoryLocation::findOrFail($request->input('from_location_id'));
            $toLocation = InventoryLocation::findOrFail($request->input('to_location_id'));

            $movements = $this->stockMovementService->transferStock(
                variant: $variant,
                fromLocation: $fromLocation,
                toLocation: $toLocation,
                quantity: $request->input('quantity'),
                user: $request->user(),
                reason: $request->input('reason'),
                notes: $request->input('notes')
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Stock transferred successfully.',
                    'movements' => [
                        'out' => $movements['out']->load(['fromLocation', 'toLocation']),
                        'in' => $movements['in']->load(['fromLocation', 'toLocation']),
                    ],
                ]);
            }

            return Redirect::back()->with('success', 'Stock transferred successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function stockTake(StockTakeRequest $request): RedirectResponse|JsonResponse
    {
        try {
            $variant = ProductVariant::findOrFail($request->input('product_variant_id'));
            $location = InventoryLocation::findOrFail($request->input('inventory_location_id'));

            $movement = $this->stockMovementService->stockTake(
                variant: $variant,
                location: $location,
                actualQuantity: $request->input('actual_quantity'),
                user: $request->user(),
                notes: $request->input('notes')
            );

            $message = $movement
                ? 'Stock take completed. Adjustment recorded.'
                : 'Stock take completed. No adjustment needed.';

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'movement' => $movement?->load(['productVariant', 'toLocation']),
                ]);
            }

            return Redirect::back()->with('success', $message);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function history(ProductVariant $variant): Response|JsonResponse
    {
        Gate::authorize('viewAny', StockMovement::class);

        $movements = StockMovement::forVariant($variant->id)
            ->with([
                'fromLocation.locatable',
                'toLocation.locatable',
                'createdBy:id,name',
            ])
            ->latest()
            ->paginate(50);

        if (request()->wantsJson()) {
            return response()->json($movements);
        }

        return Inertia::render('StockMovements/History', [
            'variant' => $variant->load('product'),
            'movements' => $movements,
        ]);
    }
}
