<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SyncProductResource;
use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Services\POSService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class SyncController extends Controller
{
    public function __construct(
        private POSService $posService
    ) {}

    /**
     * Sync products for offline POS use.
     * Returns flattened product variant data optimized for IndexedDB storage.
     */
    public function syncProducts(Request $request): JsonResponse
    {
        $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'updated_since' => 'nullable|date',
        ]);

        $shop = Shop::findOrFail($request->shop_id);

        Gate::authorize('syncProducts', [Shop::class, $shop]);

        $tenantId = auth()->user()->tenant_id;

        $query = ProductVariant::query()
            ->whereHas('product', function ($q) use ($tenantId, $shop) {
                $q->where('tenant_id', $tenantId)
                    ->where('shop_id', $shop->id)
                    ->where('is_active', true);
            })
            ->where('is_active', true)
            ->with(['product', 'packagingTypes', 'inventoryLocations']);

        // Incremental sync support
        if ($request->updated_since) {
            $query->where(function ($q) use ($request) {
                $q->where('updated_at', '>=', $request->updated_since)
                    ->orWhereHas('product', function ($q) use ($request) {
                        $q->where('updated_at', '>=', $request->updated_since);
                    });
            });
        }

        $variants = $query->get();

        return response()->json([
            'data' => SyncProductResource::collection($variants),
            'synced_at' => now()->toIso8601String(),
            'count' => $variants->count(),
        ]);
    }

    /**
     * Sync customers for offline POS use.
     */
    public function syncCustomers(Request $request): JsonResponse
    {
        Gate::authorize('syncCustomers', Shop::class);

        $request->validate([
            'updated_since' => 'nullable|date',
        ]);

        $tenantId = auth()->user()->tenant_id;

        $query = Customer::where('tenant_id', $tenantId)
            ->select([
                'id',
                'tenant_id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'updated_at',
            ]);

        if ($request->updated_since) {
            $query->where('updated_at', '>=', $request->updated_since);
        }

        $customers = $query->limit(1000)->get();

        return response()->json([
            'data' => $customers,
            'synced_at' => now()->toIso8601String(),
            'count' => $customers->count(),
        ]);
    }

    /**
     * Sync offline orders to the server.
     * Processes orders that were created offline and syncs them to the database.
     * Implements idempotency to prevent duplicate order creation.
     */
    public function syncOrders(Request $request): JsonResponse
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.offline_id' => 'required|string',
            'orders.*.shop_id' => 'required|exists:shops,id',
            'orders.*.items' => 'required|array',
            'orders.*.items.*.variant_id' => 'required|exists:product_variants,id',
            'orders.*.items.*.quantity' => 'required|numeric|min:0.01',
            'orders.*.items.*.unit_price' => 'required|decimal:0,2|min:0',
            'orders.*.items.*.packaging_type_id' => 'nullable|exists:product_packaging_types,id',
            'orders.*.items.*.discount_amount' => 'nullable|decimal:0,2|min:0',
            'orders.*.customer_id' => 'nullable|exists:customers,id',
            'orders.*.payment_method' => 'required|string',
            'orders.*.amount_tendered' => 'nullable|decimal:0,2|min:0',
            'orders.*.discount_amount' => 'nullable|decimal:0,2|min:0',
            'orders.*.notes' => 'nullable|string',
            'orders.*.created_at' => 'required|date',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $results = [];

        foreach ($request->orders as $offlineOrder) {
            $existingOrder = Order::where('offline_id', $offlineOrder['offline_id'])
                ->where('tenant_id', $tenantId)
                ->first();

            if ($existingOrder) {
                $results[] = [
                    'offline_id' => $offlineOrder['offline_id'],
                    'success' => true,
                    'order_id' => $existingOrder->id,
                    'order_number' => $existingOrder->order_number,
                    'duplicate' => true,
                    'message' => 'Order already synced',
                ];

                continue;
            }

            $shop = Shop::find($offlineOrder['shop_id']);

            if (! $shop || $shop->tenant_id !== $tenantId) {
                $results[] = [
                    'offline_id' => $offlineOrder['offline_id'],
                    'success' => false,
                    'reason' => 'unauthorized',
                    'message' => 'Shop not found or unauthorized',
                ];

                continue;
            }

            if (! Gate::allows('syncOrders', [Shop::class, $shop])) {
                $results[] = [
                    'offline_id' => $offlineOrder['offline_id'],
                    'success' => false,
                    'reason' => 'unauthorized',
                    'message' => 'Not authorized to sync orders for this shop',
                ];

                continue;
            }

            try {
                $order = DB::transaction(function () use ($shop, $offlineOrder, &$stockIssues) {
                    $stockIssues = [];
                    $variantIds = collect($offlineOrder['items'])->pluck('variant_id')->toArray();

                    $locations = InventoryLocation::where('location_type', Shop::class)
                        ->where('location_id', $shop->id)
                        ->whereIn('product_variant_id', $variantIds)
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('product_variant_id');

                    foreach ($offlineOrder['items'] as $item) {
                        $location = $locations->get($item['variant_id']);
                        $variant = ProductVariant::find($item['variant_id']);

                        if ($variant && $location) {
                            $availableStock = $location->quantity - $location->reserved_quantity;

                            if ($availableStock < $item['quantity']) {
                                $stockIssues[] = [
                                    'variant_id' => $item['variant_id'],
                                    'sku' => $variant->sku,
                                    'requested' => $item['quantity'],
                                    'available' => $availableStock,
                                ];
                            }
                        }
                    }

                    return $this->posService->createQuickSale(
                        $shop,
                        $offlineOrder['items'],
                        $offlineOrder['customer_id'] ?? null,
                        $offlineOrder['payment_method'],
                        $offlineOrder['amount_tendered'] ?? 0,
                        [
                            'offline_id' => $offlineOrder['offline_id'],
                            'discount_amount' => $offlineOrder['discount_amount'] ?? 0,
                            'notes' => $offlineOrder['notes'] ?? null,
                        ]
                    );
                });

                $results[] = [
                    'offline_id' => $offlineOrder['offline_id'],
                    'success' => true,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'duplicate' => false,
                    'has_stock_issues' => ! empty($stockIssues),
                    'stock_issues' => $stockIssues,
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'offline_id' => $offlineOrder['offline_id'],
                    'success' => false,
                    'reason' => 'error',
                    'message' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'results' => $results,
            'synced_at' => now()->toIso8601String(),
        ]);
    }
}
