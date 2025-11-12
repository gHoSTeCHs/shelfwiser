<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\SetupInventoryLocationsRequest;
use App\Http\Requests\StockTakeRequest;
use App\Http\Requests\TransferStockRequest;
use App\Models\InventoryLocation;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Services\StockMovementService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StockMovementController extends Controller
{
    public function __construct(private readonly StockMovementService $stockMovementService)
    {
    }

    /**
     * @throws AuthorizationException
     */
    public function index(): Response
    {
        Gate::authorize('viewAny', StockMovement::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('StockMovements/Index', [
            'movements' => StockMovement::query()->where('tenant_id', $tenantId)
                ->with([
                    'productVariant.product',
                    'fromLocation.location',
                    'toLocation.location',
                    'createdBy:id,name',
                ])
                ->latest()
                ->paginate(50),
            'movementTypes' => StockMovementType::forSelect(),
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function show(StockMovement $stockMovement): Response
    {
        Gate::authorize('view', $stockMovement);

        $stockMovement->load([
            'productVariant.product',
            'fromLocation.location',
            'toLocation.location',
            'createdBy',
        ]);

        return Inertia::render('StockMovements/Show', [
            'movement' => $stockMovement,
        ]);
    }

    public function adjustStock(AdjustStockRequest $request): RedirectResponse|JsonResponse
    {
        try {
            $variant = ProductVariant::query()->findOrFail($request->input('product_variant_id'));
            $location = InventoryLocation::query()->findOrFail($request->input('inventory_location_id'));
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
        } catch (Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    /**
     * @throws Throwable
     */
    public function transferStock(TransferStockRequest $request): RedirectResponse|JsonResponse
    {
        try {
            $variant = ProductVariant::query()->findOrFail($request->input('product_variant_id'));
            $fromLocation = InventoryLocation::query()->findOrFail($request->input('from_location_id'));
            $toLocation = InventoryLocation::query()->findOrFail($request->input('to_location_id'));

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
        } catch (Exception $e) {
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
            $variant = ProductVariant::query()->findOrFail($request->input('product_variant_id'));
            $location = InventoryLocation::query()->findOrFail($request->input('inventory_location_id'));

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
        } catch (Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    /**
     * @throws AuthorizationException
     */
    public function history(ProductVariant $variant): Response|JsonResponse
    {
        Gate::authorize('viewAny', StockMovement::class);

        $movements = StockMovement::forVariant($variant->id)
            ->with([
                'fromLocation.location',
                'toLocation.location',
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

    /**
     * Setup initial inventory locations for a product variant
     * @param Request $request
     * @param ProductVariant $variant
     * @return RedirectResponse
     */
    public function setupLocations(Request $request, ProductVariant $variant)
    {
//        Gate::authorize('manage', $variant->product);

        dd($request->input());

//        try {
//            $locationIds = $request->validated()['shop_ids'];
//
//            foreach ($locationIds as $shopId) {
//                InventoryLocation::query()->firstOrCreate([
//                    'product_variant_id' => $variant->id,
//                    'location_type' => 'App\\Models\\Shop',
//                    'location_id' => $shopId,
//                ], [
//                    'quantity' => 0,
//                    'reserved_quantity' => 0,
//                ]);
//            }
//
//            return Redirect::back()
//                ->with('success', 'Inventory locations setup successfully.');
//        } catch (Exception $e) {
//            return Redirect::back()
//                ->with('error', 'Failed to setup inventory locations: ' . $e->getMessage());
//        }
    }
}
