<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\ServiceVariant;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderService
{
    public function __construct(
        private readonly StockMovementService $stockMovementService
    ) {}

    /**
     * Get paginated orders with standard relations for the index page.
     */
    public function getPaginatedOrders(): LengthAwarePaginator
    {
        return Order::query()
            ->with([
                'shop:id,name,slug',
                'customer:id,first_name,last_name,email',
                'createdBy:id,first_name,last_name',
            ])
            ->withCount('items')
            ->latest()
            ->paginate(20);
    }

    /**
     * Get order counts by status for the index page stats panel.
     *
     * @return array{total: int, pending: int, confirmed: int, delivered: int}
     */
    public function getOrderStats(): array
    {
        $counts = Order::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'total' => (int) $counts->sum(),
            'pending' => (int) $counts->get(OrderStatus::PENDING->value, 0),
            'confirmed' => (int) $counts->get(OrderStatus::CONFIRMED->value, 0),
            'delivered' => (int) $counts->get(OrderStatus::DELIVERED->value, 0),
        ];
    }

    /**
     * Get active shops for order create/edit form dropdowns.
     *
     * @return Collection<int, Shop>
     */
    public function getShopsForForm(): Collection
    {
        return Shop::query()
            ->where('is_active', true)
            ->get(['id', 'name', 'slug']);
    }

    /**
     * Get active product variants for the order create form (limited to 100).
     *
     * @return Collection<int, ProductVariant>
     */
    public function getProductVariantsForCreate(): Collection
    {
        return ProductVariant::query()
            ->whereHas('product', fn ($q) => $q->where('is_active', true))
            ->with([
                'product:id,name,slug,shop_id',
                'product.shop:id,name',
                'packagingTypes' => function ($query) {
                    $query->where('is_active', true)
                        ->orderBy('display_order')
                        ->select('id', 'product_variant_id', 'name', 'display_name', 'price', 'units_per_package');
                },
            ])
            ->select('id', 'product_id', 'name', 'sku', 'price', 'is_active')
            ->where('is_active', true)
            ->limit(100)
            ->get();
    }

    /**
     * Get active product variants for the order edit form (full set with inventory).
     *
     * @return Collection<int, ProductVariant>
     */
    public function getProductVariantsForEdit(): Collection
    {
        return ProductVariant::query()
            ->whereHas('product', fn ($q) => $q->where('is_active', true))
            ->with([
                'product.shop',
                'inventoryLocations',
                'packagingTypes' => fn ($q) => $q->where('is_active', true)->orderBy('display_order'),
            ])
            ->limit(200)
            ->get();
    }

    /**
     * Apply a generic status transition for statuses not handled by dedicated service methods.
     *
     * @throws Exception
     */
    public function forceStatus(Order $order, OrderStatus $newStatus): Order
    {
        if (! $order->status->canTransitionTo($newStatus)) {
            throw new Exception("Cannot change status from {$order->status->value} to {$newStatus->value}");
        }

        $order->status = $newStatus;
        $order->save();

        return $order;
    }

    /**
     * @throws Throwable
     */
    public function createOrder(
        Tenant $tenant,
        Shop $shop,
        array $items,
        User $createdBy,
        ?User $customer = null,
        ?string $customerNotes = null,
        ?string $internalNotes = null,
        float $shippingCost = 0,
        ?string $shippingAddress = null,
        ?string $billingAddress = null
    ): Order {
        Log::info('Order creation process started.', [
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'items_count' => count($items),
        ]);

        $lastException = null;
        for ($attempt = 0; $attempt < 3; $attempt++) {
            try {
                return DB::transaction(function () use (
                    $tenant,
                    $shop,
                    $items,
                    $createdBy,
                    $customer,
                    $customerNotes,
                    $internalNotes,
                    $shippingCost,
                    $shippingAddress,
                    $billingAddress
                ) {
                    $order = Order::query()->create([
                        'tenant_id' => $tenant->id,
                        'shop_id' => $shop->id,
                        'customer_id' => $customer?->id,
                        'status' => OrderStatus::PENDING,
                        'payment_status' => PaymentStatus::UNPAID,
                        'shipping_cost' => $shippingCost,
                        'customer_notes' => $customerNotes,
                        'internal_notes' => $internalNotes,
                        'shipping_address' => $shippingAddress,
                        'billing_address' => $billingAddress,
                        'created_by' => $createdBy->id,
                    ]);

                    $this->createOrderItems($order, $items);

                    $order->load([
                        'items.productVariant.product',
                        'items.sellable',
                    ]);
                    $order->calculateTotals();
                    $order->save();

                    Log::info('Order created successfully.', ['order_id' => $order->id]);

                    return $order;
                });
            } catch (\Illuminate\Database\QueryException $e) {
                if ($attempt >= 2 || ! str_contains($e->getMessage(), 'order_number')) {
                    Log::error('Order creation failed.', [
                        'tenant_id' => $tenant->id,
                        'shop_id' => $shop->id,
                        'exception' => $e,
                    ]);
                    throw $e;
                }
                $lastException = $e;
            } catch (Throwable $e) {
                Log::error('Order creation failed.', [
                    'tenant_id' => $tenant->id,
                    'shop_id' => $shop->id,
                    'exception' => $e,
                ]);
                throw $e;
            }
        }

        throw $lastException;
    }

    /**
     * Delete an order. Only PENDING orders can be deleted; anything further along
     * the lifecycle requires cancellation/refund instead.
     *
     * @throws Throwable
     */
    public function deleteOrder(Order $order): string
    {
        if ($order->status !== OrderStatus::PENDING) {
            throw new \RuntimeException('Only pending orders can be deleted.');
        }

        $orderNumber = $order->order_number;

        DB::transaction(function () use ($order) {
            $order->items()->delete();
            $order->payments()->delete();
            $order->delete();
        });

        Log::info('Order deleted', ['order_id' => $order->id, 'order_number' => $orderNumber]);

        return $orderNumber;
    }

    /**
     * @throws Throwable
     */
    public function updateOrder(Order $order, array $data): Order
    {
        Log::info('Order update process started.', ['order_id' => $order->id]);

        if (! $order->canEdit()) {
            throw new Exception('Order cannot be edited in current status: '.$order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $data) {
                if (isset($data['items'])) {
                    $order->items()->delete();
                    $this->createOrderItems($order, $data['items']);
                }

                $order->update([
                    'customer_notes' => $data['customer_notes'] ?? $order->customer_notes,
                    'internal_notes' => $data['internal_notes'] ?? $order->internal_notes,
                    'shipping_cost' => $data['shipping_cost'] ?? $order->shipping_cost,
                    'shipping_address' => $data['shipping_address'] ?? $order->shipping_address,
                    'billing_address' => $data['billing_address'] ?? $order->billing_address,
                ]);

                $order->load([
                    'items.productVariant.product',
                    'items.sellable',
                ]);
                $order->calculateTotals();
                $order->save();

                Log::info('Order updated successfully.', ['order_id' => $order->id]);

                return $order->fresh([
                    'items.productVariant.product',
                    'items.sellable',
                ]);
            });
        } catch (Throwable $e) {
            Log::error('Order update failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function confirmOrder(Order $order, User $user): Order
    {
        if (! $order->status->canTransitionTo(OrderStatus::CONFIRMED)) {
            throw new Exception('Cannot confirm order in current status: '.$order->status->value);
        }

        try {
            return DB::transaction(function () use ($order) {
                $order->load('items.productVariant');

                foreach ($order->items as $item) {
                    // Only handle inventory for product items, skip services
                    if ($item->isProduct()) {
                        $variant = $item->productVariant;

                        // Use lockForUpdate to prevent race conditions during concurrent orders
                        $location = $variant->inventoryLocations()
                            ->where('location_type', 'App\\Models\\Shop')
                            ->where('location_id', $order->shop_id)
                            ->lockForUpdate()
                            ->first();

                        if (! $location) {
                            throw new Exception("No inventory location found for variant {$variant->sku} at shop");
                        }

                        // Check available stock (quantity - reserved)
                        $availableStock = $location->quantity - $location->reserved_quantity;
                        if ($availableStock < $item->quantity) {
                            throw new Exception("Insufficient stock for variant {$variant->sku}. Available: {$availableStock}");
                        }

                        // Use atomic increment to prevent race conditions
                        $location->increment('reserved_quantity', $item->quantity);
                    }
                    // Services don't require inventory reservation
                }

                $order->status = OrderStatus::CONFIRMED;
                $order->confirmed_at = now();
                $order->save();

                Log::info('Order confirmed successfully.', ['order_id' => $order->id]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order confirmation failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function fulfillOrder(Order $order, User $user): Order
    {
        if ($order->status !== OrderStatus::CONFIRMED) {
            throw new Exception('Order must be confirmed before fulfillment');
        }

        try {
            return DB::transaction(function () use ($order, $user) {
                $order->load('items.productVariant');

                foreach ($order->items as $item) {
                    // Only handle inventory for product items, skip services
                    if ($item->isProduct()) {
                        $variant = $item->productVariant;
                        $location = $variant->inventoryLocations()
                            ->where('location_type', 'App\\Models\\Shop')
                            ->where('location_id', $order->shop_id)
                            ->lockForUpdate()
                            ->first();

                        if (! $location) {
                            throw new Exception("No inventory location found for variant {$variant->sku}");
                        }

                        if ($location->reserved_quantity < $item->quantity) {
                            Log::error('Reserved quantity mismatch during order fulfillment', [
                                'order_id' => $order->id,
                                'variant_id' => $variant->id,
                                'reserved' => $location->reserved_quantity,
                                'needed' => $item->quantity,
                            ]);

                            throw new \RuntimeException(
                                "Reserved stock for {$variant->sku} ({$location->reserved_quantity}) is less than the order item quantity ({$item->quantity}). Order cannot be fulfilled — the reservation may have been released or double-fulfilled."
                            );
                        }

                        $location->reserved_quantity -= $item->quantity;
                        $location->save();

                        $this->stockMovementService->adjustStock(
                            $variant,
                            $location,
                            $item->quantity,
                            StockMovementType::SALE,
                            $user,
                            "Order #{$order->order_number}",
                            'Fulfilled order item'
                        );
                    }
                    // Services don't require stock movements
                }

                $order->status = OrderStatus::PROCESSING;
                $order->save();

                Log::info('Order fulfilled successfully.', ['order_id' => $order->id]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order fulfillment failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function cancelOrder(Order $order, User $user, ?string $reason = null): Order
    {
        if (! $order->canCancel()) {
            throw new Exception('Order cannot be cancelled in current status: '.$order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $user, $reason) {
                if ($order->status === OrderStatus::CONFIRMED) {
                    $order->load('items.productVariant');

                    foreach ($order->items as $item) {
                        // Only handle inventory for product items, skip services
                        if ($item->isProduct()) {
                            $variant = $item->productVariant;

                            // Use lockForUpdate to prevent race conditions
                            $location = $variant->inventoryLocations()
                                ->where('location_type', 'App\\Models\\Shop')
                                ->where('location_id', $order->shop_id)
                                ->lockForUpdate()
                                ->first();

                            if ($location) {
                                $location->decrement('reserved_quantity', $item->quantity);
                            } else {
                                Log::warning('Inventory location not found during order cancellation — reserved stock not released', [
                                    'order_id' => $order->id,
                                    'variant_id' => $variant->id,
                                    'shop_id' => $order->shop_id,
                                ]);
                            }
                        }
                        // Services don't have reserved inventory
                    }
                }

                $order->status = OrderStatus::CANCELLED;
                $order->internal_notes = ($order->internal_notes ? $order->internal_notes."\n\n" : '').
                    "Cancelled by {$user->name} at ".now()->format('Y-m-d H:i:s').
                    ($reason ? "\nReason: {$reason}" : '');
                $order->save();

                Log::info('Order cancelled successfully.', ['order_id' => $order->id]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order cancellation failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function packOrder(Order $order, User $user): Order
    {
        if (! $order->status->canTransitionTo(OrderStatus::PACKED)) {
            throw new Exception('Cannot pack order in current status: '.$order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $user) {
                $order->status = OrderStatus::PACKED;
                $order->packed_at = now();
                $order->packed_by = $user->id;
                $order->save();

                Log::info('Order packed successfully.', [
                    'order_id' => $order->id,
                    'packed_by' => $user->id,
                ]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order packing failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function shipOrder(Order $order, User $user, ?array $shippingData = null): Order
    {
        if (! $order->status->canTransitionTo(OrderStatus::SHIPPED)) {
            throw new Exception('Cannot ship order in current status: '.$order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $user, $shippingData) {
                $order->status = OrderStatus::SHIPPED;
                $order->shipped_at = now();
                $order->shipped_by = $user->id;

                if ($shippingData) {
                    if (isset($shippingData['tracking_number'])) {
                        $order->tracking_number = $shippingData['tracking_number'];
                    }
                    if (isset($shippingData['carrier'])) {
                        $order->shipping_carrier = $shippingData['carrier'];
                    }
                    if (isset($shippingData['notes'])) {
                        $order->internal_notes = ($order->internal_notes ? $order->internal_notes."\n\n" : '').
                            "Shipped by {$user->name} at ".now()->format('Y-m-d H:i:s').
                            "\n{$shippingData['notes']}";
                    }
                }

                $order->save();

                Log::info('Order shipped successfully.', [
                    'order_id' => $order->id,
                    'shipped_by' => $user->id,
                    'tracking_number' => $shippingData['tracking_number'] ?? null,
                ]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order shipping failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function deliverOrder(Order $order, User $user, ?string $notes = null): Order
    {
        if (! $order->status->canTransitionTo(OrderStatus::DELIVERED)) {
            throw new Exception('Cannot mark order as delivered in current status: '.$order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $user, $notes) {
                $order->status = OrderStatus::DELIVERED;
                $order->delivered_at = now();
                $order->delivered_by = $user->id;

                if ($notes) {
                    $order->internal_notes = ($order->internal_notes ? $order->internal_notes."\n\n" : '').
                        "Delivered by {$user->name} at ".now()->format('Y-m-d H:i:s').
                        "\n{$notes}";
                }

                $order->save();

                Log::info('Order delivered successfully.', [
                    'order_id' => $order->id,
                    'delivered_by' => $user->id,
                ]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order delivery failed.', [
                'order_id' => $order->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    public function updatePaymentStatus(Order $order, PaymentStatus $newStatus, ?string $paymentMethod = null): Order
    {
        if (! $order->payment_status->canTransitionTo($newStatus)) {
            throw new Exception("Cannot change payment status from {$order->payment_status->value} to {$newStatus->value}");
        }

        $order->payment_status = $newStatus;
        if ($paymentMethod) {
            $order->payment_method = $paymentMethod;
        }
        $order->save();

        Log::info('Payment status updated.', [
            'order_id' => $order->id,
            'new_status' => $newStatus->value,
        ]);

        return $order;
    }

    /**
     * Create order items from the provided items array.
     * Handles both product and service items with packaging and pricing logic.
     *
     * @throws Exception
     */
    private function createOrderItems(Order $order, array $items): void
    {
        // Normalise the legacy product_variant_id shorthand and collect IDs for batch loading
        $normalizedItems = array_map(function (array $item) {
            if (! isset($item['sellable_type']) && isset($item['product_variant_id'])) {
                $item['sellable_type'] = ProductVariant::class;
                $item['sellable_id'] = $item['product_variant_id'];
            }

            return $item;
        }, $items);

        $productVariantIds = array_values(array_unique(array_filter(
            array_map(fn ($i) => ($i['sellable_type'] ?? null) === ProductVariant::class ? ($i['sellable_id'] ?? null) : null, $normalizedItems)
        )));
        $serviceVariantIds = array_values(array_unique(array_filter(
            array_map(fn ($i) => ($i['sellable_type'] ?? null) === ServiceVariant::class ? ($i['sellable_id'] ?? null) : null, $normalizedItems)
        )));
        $packagingTypeIds = array_values(array_unique(array_filter(
            array_column($normalizedItems, 'product_packaging_type_id')
        )));

        $productVariants = ! empty($productVariantIds)
            ? ProductVariant::query()->whereIn('id', $productVariantIds)->get()->keyBy('id')
            : collect();
        $serviceVariants = ! empty($serviceVariantIds)
            ? ServiceVariant::query()->whereIn('id', $serviceVariantIds)->get()->keyBy('id')
            : collect();
        $packagingTypes = ! empty($packagingTypeIds)
            ? ProductPackagingType::query()->whereIn('id', $packagingTypeIds)->get()->keyBy('id')
            : collect();

        foreach ($normalizedItems as $item) {
            $sellableType = $item['sellable_type'] ?? null;
            $sellableId = $item['sellable_id'] ?? null;

            if (! $sellableType || ! $sellableId) {
                throw new Exception('Order item must specify sellable_type and sellable_id');
            }

            if ($sellableType === ProductVariant::class) {
                $variant = $productVariants->get($sellableId)
                    ?? throw new Exception("Product variant not found: {$sellableId}");

                $packagingType = null;
                $packagingDescription = null;
                $quantity = $item['quantity'];
                $unitPrice = $variant->price;

                if (isset($item['product_packaging_type_id'])) {
                    $packagingType = $packagingTypes->get($item['product_packaging_type_id']);

                    if ($packagingType) {
                        if (isset($item['package_quantity'])) {
                            $quantity = $item['package_quantity'] * $packagingType->units_per_package;
                        }

                        $unitPrice = $packagingType->price / $packagingType->units_per_package;
                        $packagingDescription = $packagingType->display_name ?? $packagingType->name;
                    }
                }

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'sellable_type' => $sellableType,
                    'sellable_id' => $sellableId,
                    'product_variant_id' => $variant->id,
                    'product_packaging_type_id' => $packagingType?->id,
                    'packaging_description' => $packagingDescription,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => max(0, min($item['discount_amount'] ?? 0, $unitPrice * $quantity)),
                    'tax_amount' => $item['tax_amount'] ?? 0,
                ]);
            } elseif ($sellableType === ServiceVariant::class) {
                $variant = $serviceVariants->get($sellableId)
                    ?? throw new Exception("Service variant not found: {$sellableId}");

                $quantity = $item['quantity'] ?? 1;
                $unitPrice = $variant->base_price;

                $metadata = [
                    'material_option' => $item['material_option'] ?? null,
                    'selected_addons' => $item['selected_addons'] ?? [],
                    'base_price' => $variant->base_price,
                ];

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'sellable_type' => $sellableType,
                    'sellable_id' => $sellableId,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => max(0, min($item['discount_amount'] ?? 0, $unitPrice * $quantity)),
                    'tax_amount' => $item['tax_amount'] ?? 0,
                    'metadata' => $metadata,
                ]);
            } else {
                throw new Exception("Unsupported sellable type: {$sellableType}");
            }
        }
    }
}
