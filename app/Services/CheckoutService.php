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
use App\Models\Shop;
use Illuminate\Support\Facades\DB;

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
        ?string $customerNotes = null
    ): Order {
        return DB::transaction(function () use (
            $cart,
            $customer,
            $shippingAddress,
            $billingAddress,
            $paymentMethod,
            $customerNotes
        ) {
            $cartSummary = $this->cartService->getCartSummary($cart);

            if (empty($cartSummary['items'])) {
                throw new \Exception('Cannot checkout with empty cart');
            }

            $productItems = collect($cartSummary['items'])->filter(fn ($item) => $item->isProduct());

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
                'order_number' => $this->generateOrderNumber(),
                'order_type' => OrderType::CUSTOMER->value,
                'status' => OrderStatus::PENDING->value,
                'payment_status' => PaymentStatus::UNPAID->value,
                'payment_method' => $paymentMethod,
                'subtotal' => $cartSummary['subtotal'],
                'tax_amount' => $cartSummary['tax'],
                'shipping_cost' => $cartSummary['shipping_fee'],
                'total_amount' => $cartSummary['total'],
                'shipping_address' => json_encode($shippingAddress),
                'billing_address' => json_encode($billingAddress),
                'customer_notes' => $customerNotes,
                'created_by' => null,
            ]);

            $locations = $locations ?? collect();

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
                        $location->decrement('quantity', $cartItem->quantity);

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

    protected function generateOrderNumber(): string
    {
        return 'ORD-'.strtoupper(uniqid());
    }
}
