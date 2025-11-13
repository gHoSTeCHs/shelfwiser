<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderService
{
    public function __construct(
        private readonly StockMovementService $stockMovementService
    ) {}

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
                $order = Order::create([
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

                foreach ($items as $item) {
                    $variant = ProductVariant::findOrFail($item['product_variant_id']);

                    $packagingType = null;
                    $packagingDescription = null;
                    $quantity = $item['quantity'];
                    $unitPrice = $item['unit_price'] ?? $variant->price;

                    if (isset($item['product_packaging_type_id'])) {
                        $packagingType = ProductPackagingType::find($item['product_packaging_type_id']);

                        if ($packagingType) {
                            if (isset($item['package_quantity'])) {
                                $quantity = $item['package_quantity'] * $packagingType->units_per_package;
                            }

                            $unitPrice = $packagingType->price / $packagingType->units_per_package;
                            $packagingDescription = $packagingType->display_name ?? $packagingType->name;
                        }
                    }

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_variant_id' => $variant->id,
                        'product_packaging_type_id' => $packagingType?->id,
                        'packaging_description' => $packagingDescription,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'discount_amount' => $item['discount_amount'] ?? 0,
                        'tax_amount' => $item['tax_amount'] ?? 0,
                    ]);
                }

                $order->load('items.productVariant.product');
                $order->calculateTotals();
                $order->save();

                Log::info('Order created successfully.', ['order_id' => $order->id]);

                return $order;
            });
        } catch (Throwable $e) {
            Log::error('Order creation failed.', [
                'tenant_id' => $tenant->id,
                'shop_id' => $shop->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function updateOrder(Order $order, array $data): Order
    {
        Log::info('Order update process started.', ['order_id' => $order->id]);

        if (!$order->canEdit()) {
            throw new Exception('Order cannot be edited in current status: ' . $order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $data) {
                if (isset($data['items'])) {
                    $order->items()->delete();

                    foreach ($data['items'] as $item) {
                        $variant = ProductVariant::findOrFail($item['product_variant_id']);

                        $packagingType = null;
                        $packagingDescription = null;
                        $quantity = $item['quantity'];
                        $unitPrice = $item['unit_price'] ?? $variant->price;

                        if (isset($item['product_packaging_type_id'])) {
                            $packagingType = ProductPackagingType::find($item['product_packaging_type_id']);

                            if ($packagingType) {
                                if (isset($item['package_quantity'])) {
                                    $quantity = $item['package_quantity'] * $packagingType->units_per_package;
                                }

                                $unitPrice = $packagingType->price / $packagingType->units_per_package;
                                $packagingDescription = $packagingType->display_name ?? $packagingType->name;
                            }
                        }

                        OrderItem::create([
                            'order_id' => $order->id,
                            'product_variant_id' => $variant->id,
                            'product_packaging_type_id' => $packagingType?->id,
                            'packaging_description' => $packagingDescription,
                            'quantity' => $quantity,
                            'unit_price' => $unitPrice,
                            'discount_amount' => $item['discount_amount'] ?? 0,
                            'tax_amount' => $item['tax_amount'] ?? 0,
                        ]);
                    }
                }

                $order->update([
                    'customer_notes' => $data['customer_notes'] ?? $order->customer_notes,
                    'internal_notes' => $data['internal_notes'] ?? $order->internal_notes,
                    'shipping_cost' => $data['shipping_cost'] ?? $order->shipping_cost,
                    'shipping_address' => $data['shipping_address'] ?? $order->shipping_address,
                    'billing_address' => $data['billing_address'] ?? $order->billing_address,
                ]);

                $order->load('items.productVariant.product');
                $order->calculateTotals();
                $order->save();

                Log::info('Order updated successfully.', ['order_id' => $order->id]);

                return $order->fresh(['items.productVariant.product']);
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
        if (!$order->status->canTransitionTo(OrderStatus::CONFIRMED)) {
            throw new Exception('Cannot confirm order in current status: ' . $order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $user) {
                foreach ($order->items as $item) {
                    $variant = $item->productVariant;
                    $location = $variant->inventoryLocations()
                        ->where('location_type', 'App\\Models\\Shop')
                        ->where('location_id', $order->shop_id)
                        ->first();

                    if (!$location) {
                        throw new Exception("No inventory location found for variant {$variant->sku} at shop");
                    }

                    if ($location->quantity - $location->reserved_quantity < $item->quantity) {
                        throw new Exception("Insufficient stock for variant {$variant->sku}. Available: " . ($location->quantity - $location->reserved_quantity));
                    }

                    $location->reserved_quantity += $item->quantity;
                    $location->save();
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
                foreach ($order->items as $item) {
                    $variant = $item->productVariant;
                    $location = $variant->inventoryLocations()
                        ->where('location_type', 'App\\Models\\Shop')
                        ->where('location_id', $order->shop_id)
                        ->first();

                    if (!$location) {
                        throw new Exception("No inventory location found for variant {$variant->sku}");
                    }

                    $location->reserved_quantity -= $item->quantity;
                    $location->quantity -= $item->quantity;
                    $location->save();

                    $this->stockMovementService->adjustStock(
                        $variant,
                        $location,
                        $item->quantity,
                        StockMovementType::SALE,
                        $user,
                        "Order #{$order->order_number}",
                        "Fulfilled order item"
                    );
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
        if (!$order->canCancel()) {
            throw new Exception('Order cannot be cancelled in current status: ' . $order->status->value);
        }

        try {
            return DB::transaction(function () use ($order, $user, $reason) {
                if ($order->status === OrderStatus::CONFIRMED) {
                    foreach ($order->items as $item) {
                        $variant = $item->productVariant;
                        $location = $variant->inventoryLocations()
                            ->where('location_type', 'App\\Models\\Shop')
                            ->where('location_id', $order->shop_id)
                            ->first();

                        if ($location) {
                            $location->reserved_quantity -= $item->quantity;
                            $location->save();
                        }
                    }
                }

                $order->status = OrderStatus::CANCELLED;
                $order->internal_notes = ($order->internal_notes ? $order->internal_notes . "\n\n" : '') .
                    "Cancelled by {$user->name} at " . now()->format('Y-m-d H:i:s') .
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

    public function updatePaymentStatus(Order $order, PaymentStatus $newStatus, ?string $paymentMethod = null): Order
    {
        if (!$order->payment_status->canTransitionTo($newStatus)) {
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
}
