<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SyncProductResource;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Services\POSService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        $tenantId = auth()->user()->tenant_id;

        // Verify user has access to this shop
        if ($shop->tenant_id !== $tenantId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

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
     */
    public function syncOrders(Request $request): JsonResponse
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.offline_id' => 'required|string',
            'orders.*.shop_id' => 'required|exists:shops,id',
            'orders.*.items' => 'required|array',
            'orders.*.items.*.variant_id' => 'required|exists:product_variants,id',
            'orders.*.items.*.quantity' => 'required|integer|min:1',
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
            $shop = Shop::find($offlineOrder['shop_id']);

            if (!$shop || $shop->tenant_id !== $tenantId) {
                $results[] = [
                    'offline_id' => $offlineOrder['offline_id'],
                    'success' => false,
                    'reason' => 'unauthorized',
                    'message' => 'Shop not found or unauthorized',
                ];
                continue;
            }

            // Check stock availability
            $stockIssues = [];
            foreach ($offlineOrder['items'] as $item) {
                $variant = ProductVariant::with('inventoryLocations')->find($item['variant_id']);
                if ($variant && $variant->available_stock < $item['quantity']) {
                    $stockIssues[] = [
                        'variant_id' => $item['variant_id'],
                        'sku' => $variant->sku,
                        'requested' => $item['quantity'],
                        'available' => $variant->available_stock,
                    ];
                }
            }

            // We allow sales even with stock issues (per user preference)
            // but flag them for review
            try {
                $order = DB::transaction(function () use ($shop, $offlineOrder) {
                    return $this->posService->createQuickSale(
                        $shop,
                        $offlineOrder['items'],
                        $offlineOrder['customer_id'] ?? null,
                        $offlineOrder['payment_method'],
                        $offlineOrder['amount_tendered'] ?? 0,
                        [
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
                    'has_stock_issues' => !empty($stockIssues),
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
