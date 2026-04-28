<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\RecordPurchaseRequest;
use App\Http\Requests\SetupInventoryLocationsRequest;
use App\Http\Requests\StockMovementExportRequest;
use App\Http\Requests\StockMovementIndexRequest;
use App\Http\Requests\StockTakeRequest;
use App\Http\Requests\TransferStockRequest;
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
use Illuminate\Support\Facades\Log;
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

        $stockMovement->loadRelations();

        return Inertia::render('StockMovements/Show', [
            'movement' => $stockMovement,
        ]);
    }

    public function adjustStock(AdjustStockRequest $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('adjustStock', StockMovement::class);

        try {
            $movement = $this->stockMovementService->adjustStockFromValidated(
                $request->validated(),
                $request->user(),
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Stock adjusted successfully.',
                    'movement' => $movement->load(['productVariant', 'toLocation']),
                ]);
            }

            return Redirect::back()->with('success', 'Stock adjusted successfully.');
        } catch (AuthorizationException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
            }

            abort(403, $e->getMessage());
        } catch (\RuntimeException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        } catch (Exception $e) {
            Log::error('Stock adjustment failed', ['error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Stock adjustment failed.'], 500);
            }

            return Redirect::back()->with('error', 'Stock adjustment failed.');
        }
    }

    /**
     * @throws Throwable
     */
    public function transferStock(TransferStockRequest $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('transferStock', StockMovement::class);

        try {
            $movements = $this->stockMovementService->transferStockFromValidated(
                $request->validated(),
                $request->user(),
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
        } catch (AuthorizationException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
            }

            abort(403, $e->getMessage());
        } catch (\RuntimeException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        } catch (Exception $e) {
            Log::error('Stock transfer failed', ['error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Stock transfer failed.'], 500);
            }

            return Redirect::back()->with('error', 'Stock transfer failed.');
        }
    }

    /**
     * @throws Throwable
     */
    public function stockTake(StockTakeRequest $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('stockTake', StockMovement::class);

        try {
            $movement = $this->stockMovementService->stockTakeFromValidated(
                $request->validated(),
                $request->user(),
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
        } catch (AuthorizationException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
            }

            abort(403, $e->getMessage());
        } catch (\RuntimeException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        } catch (Exception $e) {
            Log::error('Stock take failed', ['error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Stock take failed.'], 500);
            }

            return Redirect::back()->with('error', 'Stock take failed.');
        }
    }

    /**
     * @throws AuthorizationException
     */
    public function history(Request $request, ProductVariant $variant): Response|JsonResponse
    {
        Gate::authorize('viewAny', StockMovement::class);

        abort_unless(
            $request->user()->accessibleShopIds()->contains($variant->product->shop_id),
            403
        );

        $movements = $this->stockMovementService->getVariantHistory($variant);

        if ($request->wantsJson()) {
            return response()->json($movements);
        }

        return Inertia::render('StockMovements/History', [
            'variant' => $variant->load('product'),
            'movements' => $movements,
        ]);
    }

    /**
     * @throws Throwable
     */
    public function recordPurchase(RecordPurchaseRequest $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('recordPurchase', StockMovement::class);

        try {
            $movement = $this->stockMovementService->recordPurchaseFromValidated(
                $request->validated(),
                $request->user(),
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Purchase recorded successfully.',
                    'movement' => $movement->load(['productVariant', 'packagingType', 'toLocation']),
                ]);
            }

            return Redirect::back()->with('success', 'Purchase recorded successfully.');
        } catch (\RuntimeException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }

            return Redirect::back()->with('error', $e->getMessage());
        } catch (Exception $e) {
            Log::error('Purchase recording failed', ['error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Failed to record purchase.'], 500);
            }

            return Redirect::back()->with('error', 'Failed to record purchase.');
        }
    }

    /**
     * Setup initial inventory locations for a product variant
     */
    public function setupLocations(SetupInventoryLocationsRequest $request, ProductVariant $variant): RedirectResponse
    {
        Gate::authorize('setupLocations', StockMovement::class);

        try {
            $this->stockMovementService->setupLocations($variant, $request->validated()['shop_ids']);

            return Redirect::back()
                ->with('success', 'Inventory locations setup successfully.');
        } catch (\RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        } catch (Exception $e) {
            Log::error('Setup inventory locations failed', ['variant_id' => $variant->id, 'error' => $e->getMessage()]);

            return Redirect::back()->with('error', 'Failed to setup inventory locations.');
        }
    }

    public function export(StockMovementExportRequest $request): StreamedResponse
    {
        Gate::authorize('viewAny', StockMovement::class);

        $variantId = $request->validated('variant_id');

        $movements = $this->stockMovementService->getMovementsForExport(
            $variantId !== null ? (int) $variantId : null,
            $request->user(),
        );
        $formatted = $this->stockMovementService->formatMovementsExport($movements);
        $filename = 'stock-movements-'.now()->format('Y-m-d-His').'.csv';

        return $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], $filename);
    }
}
