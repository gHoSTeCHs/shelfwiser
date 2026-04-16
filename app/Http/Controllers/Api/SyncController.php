<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SyncCustomersRequest;
use App\Http\Requests\Api\SyncOrdersRequest;
use App\Http\Requests\Api\SyncProductsRequest;
use App\Http\Resources\SyncCustomerResource;
use App\Http\Resources\SyncProductResource;
use App\Models\Shop;
use App\Services\OfflineSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SyncController extends Controller
{
    public function __construct(
        private readonly OfflineSyncService $offlineSyncService,
    ) {}

    /**
     * Sync products for offline POS use.
     * Returns flattened product variant data optimized for IndexedDB storage.
     */
    public function syncProducts(SyncProductsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $shop = Shop::query()->findOrFail($validated['shop_id']);

        Gate::authorize('syncProducts', [Shop::class, $shop]);

        $variants = $this->offlineSyncService->syncProducts($shop, $validated['updated_since'] ?? null);

        return response()->json([
            'data' => SyncProductResource::collection($variants),
            'synced_at' => now()->toIso8601String(),
            'count' => $variants->count(),
        ]);
    }

    /**
     * Sync customers for offline POS use.
     */
    public function syncCustomers(SyncCustomersRequest $request): JsonResponse
    {
        Gate::authorize('syncCustomers', Shop::class);

        $customers = $this->offlineSyncService->syncCustomers($request->validated('updated_since'));

        return response()->json([
            'data' => SyncCustomerResource::collection($customers),
            'synced_at' => now()->toIso8601String(),
            'count' => $customers->count(),
        ]);
    }

    /**
     * Sync offline orders to the server.
     * Processes orders that were created offline and syncs them to the database.
     * Implements idempotency to prevent duplicate order creation.
     */
    public function syncOrders(SyncOrdersRequest $request): JsonResponse
    {
        $results = $this->offlineSyncService->syncOrders(
            $request->user(),
            $request->validated('orders'),
        );

        return response()->json([
            'results' => $results,
            'synced_at' => now()->toIso8601String(),
        ]);
    }
}
