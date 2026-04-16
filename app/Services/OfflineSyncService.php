<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Throwable;

class OfflineSyncService
{
    public function __construct(
        private readonly POSService $posService,
    ) {}

    /**
     * Fetch product variants for a shop, optionally filtered to those updated since a timestamp.
     */
    public function syncProducts(Shop $shop, ?string $updatedSince): Collection
    {
        $query = ProductVariant::query()
            ->whereHas('product', function ($q) use ($shop) {
                $q->where('shop_id', $shop->id)
                    ->where('is_active', true);
            })
            ->where('is_active', true)
            ->with(['product', 'packagingTypes', 'inventoryLocations']);

        if ($updatedSince) {
            $query->where(function ($q) use ($updatedSince) {
                $q->where('updated_at', '>=', $updatedSince)
                    ->orWhereHas('product', function ($q) use ($updatedSince) {
                        $q->where('updated_at', '>=', $updatedSince);
                    });
            });
        }

        return $query->get();
    }

    /**
     * Fetch customers for the authenticated tenant, optionally filtered by updated_since.
     */
    public function syncCustomers(?string $updatedSince): Collection
    {
        $query = Customer::query()
            ->select([
                'id',
                'tenant_id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'updated_at',
            ]);

        if ($updatedSince) {
            $query->where('updated_at', '>=', $updatedSince);
        }

        return $query->limit(1000)->get();
    }

    /**
     * Sync a batch of offline orders to the server.
     * Each order is processed independently — failures are captured per-order in the result array.
     *
     * @param  array<int, array<string, mixed>>  $orders
     * @return array<int, array<string, mixed>>
     */
    public function syncOrders(User $user, array $orders): array
    {
        $shopIds = collect($orders)->pluck('shop_id')->filter()->unique()->values();
        $shops = Shop::query()->whereIn('id', $shopIds)->get()->keyBy('id');

        $results = [];

        foreach ($orders as $offlineOrder) {
            $shop = $shops->get($offlineOrder['shop_id']);
            $results[] = $this->processSingleOrder($user, $offlineOrder, $shop);
        }

        return $results;
    }

    /**
     * @param  array<string, mixed>  $offlineOrder
     * @return array<string, mixed>
     */
    private function processSingleOrder(User $user, array $offlineOrder, ?Shop $shop): array
    {
        $existingOrder = Order::query()
            ->where('offline_id', $offlineOrder['offline_id'])
            ->first();

        if ($existingOrder) {
            return [
                'offline_id' => $offlineOrder['offline_id'],
                'success' => true,
                'order_id' => $existingOrder->id,
                'order_number' => $existingOrder->order_number,
                'duplicate' => true,
                'message' => 'Order already synced',
            ];
        }

        if (! $shop) {
            return [
                'offline_id' => $offlineOrder['offline_id'],
                'success' => false,
                'reason' => 'unauthorized',
                'message' => 'Shop not found or unauthorized',
            ];
        }

        if (! Gate::forUser($user)->allows('syncOrders', [Shop::class, $shop])) {
            return [
                'offline_id' => $offlineOrder['offline_id'],
                'success' => false,
                'reason' => 'unauthorized',
                'message' => 'Not authorized to sync orders for this shop',
            ];
        }

        try {
            $stockIssues = [];

            $order = DB::transaction(function () use ($shop, $offlineOrder, $user, &$stockIssues) {
                $stockIssues = $this->detectStockIssues($shop, $offlineOrder['items']);

                return $this->posService->createQuickSale(
                    shop: $shop,
                    items: $offlineOrder['items'],
                    user: $user,
                    customerId: $offlineOrder['customer_id'] ?? null,
                    paymentMethod: $offlineOrder['payment_method'],
                    amountTendered: (float) ($offlineOrder['amount_tendered'] ?? 0),
                    options: [
                        'offline_id' => $offlineOrder['offline_id'],
                        'discount_amount' => $offlineOrder['discount_amount'] ?? 0,
                        'notes' => $offlineOrder['notes'] ?? null,
                    ],
                );
            });

            return [
                'offline_id' => $offlineOrder['offline_id'],
                'success' => true,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'duplicate' => false,
                'has_stock_issues' => ! empty($stockIssues),
                'stock_issues' => $stockIssues,
            ];
        } catch (Throwable $e) {
            Log::error('Sync order failed', [
                'offline_id' => $offlineOrder['offline_id'],
                'error' => $e->getMessage(),
            ]);

            return [
                'offline_id' => $offlineOrder['offline_id'],
                'success' => false,
                'reason' => 'error',
                'message' => 'Failed to sync order. Please try again or contact support.',
            ];
        }
    }

    /**
     * Pre-check stock availability for sync reporting.
     * Uses pessimistic locking to align with the decrement performed inside createQuickSale.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function detectStockIssues(Shop $shop, array $items): array
    {
        $variantIds = collect($items)->pluck('variant_id')->toArray();

        $locations = InventoryLocation::query()
            ->where('location_type', Shop::class)
            ->where('location_id', $shop->id)
            ->whereIn('product_variant_id', $variantIds)
            ->with('productVariant:id,sku')
            ->lockForUpdate()
            ->get()
            ->keyBy('product_variant_id');

        $issues = [];

        foreach ($items as $item) {
            $location = $locations->get($item['variant_id']);

            if (! $location || ! $location->productVariant) {
                continue;
            }

            $availableStock = $location->quantity - $location->reserved_quantity;

            if ($availableStock < $item['quantity']) {
                $issues[] = [
                    'variant_id' => $item['variant_id'],
                    'sku' => $location->productVariant->sku,
                    'requested' => $item['quantity'],
                    'available' => $availableStock,
                ];
            }
        }

        return $issues;
    }
}
