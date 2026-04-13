<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\RecordPurchaseRequest;
use App\Http\Requests\SetupInventoryLocationsRequest;
use App\Http\Requests\StockMovementIndexRequest;
use App\Http\Requests\StockTakeRequest;
use App\Http\Requests\TransferStockRequest;
use App\Models\InventoryLocation;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Services\ExportService;
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
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class StockMovementController extends Controller
{
    public function __construct(
        private readonly StockMovementService $stockMovementService,
        private readonly ExportService $exportService,
    ) {}

    /**
     * @throws AuthorizationException
     */
    public function index(StockMovementIndexRequest $request): Response
    {
        Gate::authorize('viewAny', StockMovement::class);

        $user = $request->user();
        $shopId = $request->validated('shop');

        return Inertia::render('StockMovements/Index', [
            'movements' => $this->stockMovementService->getMovements($user, $shopId),
            'movementTypes' => StockMovementType::forSelect(),
            'shops' => $user->accessibleShops(),
            'selectedShop' => $shopId,
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
            'packagingType',
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
        Gate::authorize('adjustStock', StockMovement::class);

        $location = InventoryLocation::query()->findOrFail($request->input('inventory_location_id'));
        if (! $request->user()->shops()->where('shops.id', $location->shop_id)->exists()) {
            abort(403, 'You do not have access to this shop\'s inventory.');
        }

        try {
            $variant = ProductVariant::query()->findOrFail($request->input('product_variant_id'));
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
        Gate::authorize('transferStock', StockMovement::class);

        $fromLocation = InventoryLocation::query()->findOrFail($request->input('from_location_id'));
        $toLocation = InventoryLocation::query()->findOrFail($request->input('to_location_id'));

        $userShops = $request->user()->shops()->pluck('shops.id');
        if (! $userShops->contains($fromLocation->shop_id) || ! $userShops->contains($toLocation->shop_id)) {
            abort(403, 'You do not have access to this shop\'s inventory.');
        }

        try {
            $variant = ProductVariant::query()->findOrFail($request->input('product_variant_id'));

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

    /**
     * @throws Throwable
     */
    public function stockTake(StockTakeRequest $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('stockTake', StockMovement::class);

        $location = InventoryLocation::query()->findOrFail($request->input('inventory_location_id'));
        if (! $request->user()->shops()->where('shops.id', $location->shop_id)->exists()) {
            abort(403, 'You do not have access to this shop\'s inventory.');
        }

        try {
            $variant = ProductVariant::query()->findOrFail($request->input('product_variant_id'));

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
                'createdBy:id,first_name',
            ])
            ->latest()
            ->paginate(20);

        if (request()->wantsJson()) {
            return response()->json($movements);
        }

        return Inertia::render('StockMovements/History', [
            'variant' => $variant->load('product'),
            'movements' => $movements,
        ]);
    }

    /**
     * Record a purchase with packaging
     *
     * @throws Throwable
     */
    public function recordPurchase(RecordPurchaseRequest $request): RedirectResponse|JsonResponse
    {
        try {
            $variant = ProductVariant::query()->findOrFail($request->input('product_variant_id'));
            $location = InventoryLocation::query()->findOrFail($request->input('location_id'));
            $packagingType = ProductPackagingType::query()->findOrFail($request->input('product_packaging_type_id'));

            $movement = $this->stockMovementService->recordPurchase(
                variant: $variant,
                location: $location,
                packageQuantity: $request->input('package_quantity'),
                packagingType: $packagingType,
                costPerPackage: $request->input('cost_per_package'),
                user: $request->user(),
                notes: $request->input('notes')
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Purchase recorded successfully.',
                    'movement' => $movement->load(['productVariant', 'packagingType', 'toLocation']),
                ]);
            }

            return Redirect::back()->with('success', 'Purchase recorded successfully.');
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
     * Setup initial inventory locations for a product variant
     */
    public function setupLocations(SetupInventoryLocationsRequest $request, ProductVariant $variant): RedirectResponse
    {
        try {
            $shopIds = $request->validated()['shop_ids'];

            foreach ($shopIds as $shopId) {
                InventoryLocation::query()->firstOrCreate([
                    'product_variant_id' => $variant->id,
                    'location_type' => 'App\\Models\\Shop',
                    'location_id' => $shopId,
                ], [
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                ]);
            }

            return Redirect::back()
                ->with('success', 'Inventory locations setup successfully.');
        } catch (Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to setup inventory locations: '.$e->getMessage());
        }
    }

    public function export(Request $request): StreamedResponse
    {
        Gate::authorize('viewAny', StockMovement::class);

        $variantId = $request->query('variant_id');
        $variantId = $variantId !== null ? (int) $variantId : null;

        $movements = $this->stockMovementService->getMovementsForExport($variantId);
        $formatted = $this->stockMovementService->formatMovementsExport($movements);
        $filename = 'stock-movements-'.now()->format('Y-m-d-His').'.csv';

        return $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], $filename);
    }
}
