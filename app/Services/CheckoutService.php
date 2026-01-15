<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected StockMovementService $stockMovementService
    ) {}

    public function createOrderFromCart(
        Cart $cart,
        Customer $customer,
        array $shippingAddress,
        array $billingAddress,
        string $paymentMethod = 'cash_on_delivery',
        ?string $customerNotes = null,
        ?string $paymentReference = null,
        ?string $idempotencyKey = null
    ): Order {
        return DB::transaction(function () use (
            $cart,
            $customer,
            $shippingAddress,
            $billingAddress,
            $paymentMethod,
            $customerNotes,
            $paymentReference,
            $idempotencyKey
        ) {
            $cartSummary = $this->cartService->getCartSummary($cart);

            if (empty($cartSummary['items'])) {
                throw new \Exception('Cannot checkout with empty cart');
            }

            $productItems = collect($cartSummary['items'])->filter(fn ($item) => $item->isProduct());

            $locations = collect();

            if ($productItems->isNotEmpty()) {
                $variantIds = $productItems->pluck('product_variant_id')->toArray();

                $locations = InventoryLocation::where('location_type', Shop::class)
                    ->where('location_id', $cart->shop_id)
                    ->whereIn('product_variant_id', $variantIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('product_variant_id');

                foreach ($productItems as $item) {
                    $location = $locations->get($item->product_variant_id);
                    $availableStock = $location ? $location->quantity - $location->reserved_quantity : 0;

                    if ($availableStock < $item->quantity) {
                        throw new \Exception(
                            "Insufficient stock for {$item->productVariant->product->name}. ".
                            "Only {$availableStock} available."
                        );
                    }
                }
            }

            $order = Order::create([
                'tenant_id' => $cart->shop->tenant_id,
                'shop_id' => $cart->shop_id,
                'customer_id' => $customer->id,
                'order_type' => OrderType::CUSTOMER->value,
                'status' => OrderStatus::PENDING->value,
                'payment_status' => PaymentStatus::UNPAID->value,
                'payment_method' => $paymentMethod,
                'payment_reference' => $paymentReference,
                'offline_id' => $idempotencyKey,
                'subtotal' => $cartSummary['subtotal'],
                'tax_amount' => $cartSummary['tax'],
                'shipping_cost' => $cartSummary['shipping_fee'],
                'total_amount' => $cartSummary['total'],
                'shipping_address' => json_encode($shippingAddress),
                'billing_address' => json_encode($billingAddress),
                'customer_notes' => $customerNotes,
                'created_by' => null,
            ]);

            foreach ($cartSummary['items'] as $cartItem) {
                $orderItemData = [
                    'order_id' => $order->id,
                    'tenant_id' => $cart->tenant_id,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->price,
                    'total_amount' => $cartItem->price * $cartItem->quantity,
                ];

                if ($cartItem->isProduct()) {
                    $orderItemData['product_variant_id'] = $cartItem->product_variant_id;
                    $orderItemData['product_packaging_type_id'] = $cartItem->product_packaging_type_id;
                    $orderItemData['sellable_type'] = \App\Models\ProductVariant::class;
                    $orderItemData['sellable_id'] = $cartItem->product_variant_id;
                } else {
                    $orderItemData['sellable_type'] = $cartItem->sellable_type;
                    $orderItemData['sellable_id'] = $cartItem->sellable_id;

                    $metadata = [];
                    if ($cartItem->material_option) {
                        $metadata['material_option'] = $cartItem->material_option;
                    }
                    if ($cartItem->selected_addons) {
                        $metadata['selected_addons'] = $cartItem->selected_addons;
                    }
                    if ($cartItem->base_price) {
                        $metadata['base_price'] = $cartItem->base_price;
                    }
                    if (! empty($metadata)) {
                        $orderItemData['metadata'] = $metadata;
                    }
                }

                $orderItem = OrderItem::create($orderItemData);

                if ($cartItem->isProduct()) {
                    $location = $locations->get($cartItem->product_variant_id);
                    if ($location) {
                        $quantityBefore = $location->quantity;
                        $reservedBefore = $location->reserved_quantity;

                        if ($location->reserved_quantity >= $cartItem->quantity) {
                            $location->reserved_quantity -= $cartItem->quantity;
                        }

                        $location->quantity -= $cartItem->quantity;
                        $location->save();

                        $this->stockMovementService->recordMovement([
                            'tenant_id' => $cart->tenant_id,
                            'shop_id' => $cart->shop_id,
                            'product_variant_id' => $cartItem->product_variant_id,
                            'from_location_id' => $location->id,
                            'type' => StockMovementType::SALE,
                            'quantity' => -$cartItem->quantity,
                            'quantity_before' => $quantityBefore,
                            'quantity_after' => $location->quantity,
                            'reference_number' => $order->order_number,
                            'reason' => "E-commerce order {$order->order_number}",
                            'order_id' => $order->id,
                        ]);
                    }
                }
            }

            $cart->items()->delete();
            $cart->delete();

            return $order->fresh([
                'items.productVariant.product',
                'items.packagingType',
                'items.sellable.service',
            ]);
        });
    }

    /**
     * Verify Paystack payment and update order status.
     */
    public function verifyPaystackPayment(string $reference, Shop $shop): ?Order
    {
        $order = Order::where('payment_reference', $reference)
            ->where('shop_id', $shop->id)
            ->first();

        if (! $order) {
            Log::warning('Order not found for payment reference', [
                'reference' => $reference,
                'shop_id' => $shop->id,
            ]);

            return null;
        }

        if ($order->payment_status === PaymentStatus::PAID->value) {
            return $order;
        }

        $secretKey = config('services.paystack.secret_key');
        if (! $secretKey) {
            Log::error('Paystack secret key not configured');

            return $order;
        }

        try {
            $response = Http::withToken($secretKey)
                ->get("https://api.paystack.co/transaction/verify/{$reference}");

            if (! $response->successful()) {
                Log::error('Paystack verification failed', [
                    'reference' => $reference,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return $order;
            }

            $data = $response->json();

            if ($data['status'] === true && $data['data']['status'] === 'success') {
                $this->updatePaymentStatus(
                    $reference,
                    PaymentStatus::PAID,
                    $data['data']['id'] ?? null
                );
                $order->refresh();
            }

            return $order;

        } catch (\Exception $e) {
            Log::error('Paystack verification exception', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return $order;
        }
    }

    /**
     * Update order payment status.
     */
    public function updatePaymentStatus(
        string $paymentReference,
        PaymentStatus $status,
        ?string $transactionId = null
    ): bool {
        $order = Order::where('payment_reference', $paymentReference)->first();

        if (! $order) {
            Log::warning('Order not found for payment update', [
                'reference' => $paymentReference,
            ]);

            return false;
        }

        return DB::transaction(function () use ($order, $status, $transactionId, $paymentReference) {
            $order->update([
                'payment_status' => $status->value,
            ]);

            if ($status === PaymentStatus::PAID) {
                $order->update([
                    'status' => OrderStatus::CONFIRMED->value,
                    'confirmed_at' => now(),
                ]);

                OrderPayment::create([
                    'tenant_id' => $order->tenant_id,
                    'order_id' => $order->id,
                    'amount' => $order->total_amount,
                    'payment_method' => $order->payment_method,
                    'reference_number' => $transactionId ?? $paymentReference,
                    'status' => 'completed',
                    'paid_at' => now(),
                    'notes' => 'Payment verified via Paystack',
                ]);
            }

            Log::info('Payment status updated', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $status->value,
                'transaction_id' => $transactionId,
            ]);

            return true;
        });
    }
}
