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
     * @param Cart $cart The shopping cart
     * @param Customer $customer The customer placing the order
     * @param array $shippingAddress Shipping address details
     * @param array $billingAddress Billing address details
     * @param string $paymentMethod Payment method (default: cash_on_delivery)
     * @param string|null $customerNotes Optional customer notes
     * @return Order The created order with loaded relationships
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

            foreach ($cartSummary['items'] as $item) {
                if ($item->productVariant->available_stock < $item->quantity) {
                    throw new \Exception(
                        "Insufficient stock for {$item->productVariant->product->name}. " .
                        "Only {$item->productVariant->available_stock} available."
                    );
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
                'created_by' => $customer->id,
            ]);

            foreach ($cartSummary['items'] as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $cartItem->product_variant_id,
                    'product_packaging_type_id' => $cartItem->product_packaging_type_id,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->price,
                    'total_amount' => $cartItem->price * $cartItem->quantity,
                ]);

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

            $cart->items()->delete();
            $cart->delete();

            return $order->fresh(['items.productVariant.product', 'items.packagingType']);
        });
    }

    /**
     * Generate unique order number with ORD prefix.
     *
     * @return string The generated order number
     */
    protected function generateOrderNumber(): string
    {
        return 'ORD-' . strtoupper(uniqid());
    }
}
