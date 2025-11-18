<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected StockMovementService $stockMovementService
    ) {}

    /**
     * Create order from cart with stock reservation.
     *
     * @param  Cart  $cart  The shopping cart
     * @param  Customer  $customer  The customer placing the order
     * @param  array  $shippingAddress  Shipping address details
     * @param  array  $billingAddress  Billing address details
     * @param  string  $paymentMethod  Payment method (default: cash_on_delivery)
     * @param  string|null  $customerNotes  Optional customer notes
     * @return Order The created order with loaded relationships
     *
     * @throws \Exception If cart is empty or stock is insufficient
     */
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

            // Validate stock availability for products only (services don't require stock)
            foreach ($cartSummary['items'] as $item) {
                if ($item->isProduct()) {
                    if ($item->productVariant->available_stock < $item->quantity) {
                        throw new \Exception(
                            "Insufficient stock for {$item->productVariant->product->name}. ".
                            "Only {$item->productVariant->available_stock} available."
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
                'created_by' => null, // E-commerce orders have no staff creator
            ]);

            foreach ($cartSummary['items'] as $cartItem) {
                $orderItemData = [
                    'order_id' => $order->id,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->price,
                    'total_amount' => $cartItem->price * $cartItem->quantity,
                ];

                if ($cartItem->isProduct()) {
                    // Product-specific fields
                    $orderItemData['product_variant_id'] = $cartItem->product_variant_id;
                    $orderItemData['product_packaging_type_id'] = $cartItem->product_packaging_type_id;
                    $orderItemData['sellable_type'] = \App\Models\ProductVariant::class;
                    $orderItemData['sellable_id'] = $cartItem->product_variant_id;
                } else {
                    // Service-specific fields
                    $orderItemData['sellable_type'] = $cartItem->sellable_type;
                    $orderItemData['sellable_id'] = $cartItem->sellable_id;

                    // Store service metadata (material option, addons, etc.)
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

                OrderItem::create($orderItemData);

                // Only record stock movements for products (services don't affect inventory)
                if ($cartItem->isProduct()) {
                    $this->stockMovementService->recordMovement(
                        $cartItem->productVariant,
                        -$cartItem->quantity,
                        StockMovementType::SALE,
                        "E-commerce order {$order->order_number}",
                        $customer->id,
                        null,
                        null,
                        null,
                        0,
                        $order->id
                    );
                }
            }

            $cart->items()->delete();
            $cart->delete();

            return $order->fresh([
                'items.productVariant.product',
                'items.packagingType',
                'items.sellable.service', // For service items
            ]);
        });
    }

    /**
     * Generate unique order number with ORD prefix.
     *
     * @return string The generated order number
     */
    protected function generateOrderNumber(): string
    {
        return 'ORD-'.strtoupper(uniqid());
    }
}
