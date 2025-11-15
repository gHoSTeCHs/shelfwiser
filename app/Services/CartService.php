<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;

class CartService
{
    /**
     * Get or create a cart for the current session/customer.
     */
    public function getCart(Shop $shop, ?int $customerId = null): Cart
    {
        if ($customerId) {
            return Cart::firstOrCreate(
                [
                    'customer_id' => $customerId,
                    'shop_id' => $shop->id,
                ],
                [
                    'expires_at' => now()->addDays(30),
                ]
            );
        }

        $sessionId = Session::getId();

        return Cart::firstOrCreate(
            [
                'session_id' => $sessionId,
                'shop_id' => $shop->id,
            ],
            [
                'expires_at' => now()->addDays(7),
            ]
        );
    }

    /**
     * Add an item to the cart.
     */
    public function addItem(
        Cart $cart,
        int $variantId,
        int $quantity = 1,
        ?int $packagingTypeId = null
    ): CartItem {
        $variant = ProductVariant::findOrFail($variantId);

        // Check stock availability
        if (!$this->checkStockAvailability($variant, $quantity)) {
            throw new \Exception('Insufficient stock available. Only ' . $variant->available_stock . ' units in stock.');
        }

        return DB::transaction(function () use ($cart, $variant, $quantity, $packagingTypeId) {
            $cartItem = CartItem::where([
                'cart_id' => $cart->id,
                'product_variant_id' => $variant->id,
                'product_packaging_type_id' => $packagingTypeId,
            ])->first();

            if ($cartItem) {
                // Update existing item
                $newQuantity = $cartItem->quantity + $quantity;

                // Check stock for new quantity
                if (!$this->checkStockAvailability($variant, $newQuantity)) {
                    throw new \Exception('Cannot add more items. Only ' . $variant->available_stock . ' units available.');
                }

                $cartItem->update(['quantity' => $newQuantity]);
            } else {
                // Create new item
                $cartItem = CartItem::create([
                    'cart_id' => $cart->id,
                    'product_variant_id' => $variant->id,
                    'product_packaging_type_id' => $packagingTypeId,
                    'quantity' => $quantity,
                    'price' => $variant->price, // Snapshot current price
                ]);
            }

            $cart->touch(); // Update cart timestamp
            return $cartItem->fresh(['productVariant.product', 'packagingType']);
        });
    }

    /**
     * Update cart item quantity.
     */
    public function updateQuantity(CartItem $item, int $quantity): ?CartItem
    {
        if ($quantity <= 0) {
            $item->delete();
            $item->cart->touch();
            return null;
        }

        // Check stock availability
        if (!$this->checkStockAvailability($item->productVariant, $quantity)) {
            throw new \Exception('Insufficient stock available. Only ' . $item->productVariant->available_stock . ' units in stock.');
        }

        $item->update(['quantity' => $quantity]);
        $item->cart->touch();

        return $item->fresh(['productVariant.product', 'packagingType']);
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(CartItem $item): void
    {
        $cart = $item->cart;
        $item->delete();
        $cart->touch();
    }

    /**
     * Clear all items from the cart.
     */
    public function clearCart(Cart $cart): void
    {
        $cart->items()->delete();
        $cart->touch();
    }

    /**
     * Get cart summary with calculations.
     */
    public function getCartSummary(Cart $cart): array
    {
        $items = $cart->items()->with(['productVariant.product', 'packagingType'])->get();

        $subtotal = $items->sum(fn($item) => $item->price * $item->quantity);
        $shippingFee = $this->calculateShipping($cart, $subtotal);
        $tax = $this->calculateTax($cart, $subtotal);
        $total = $subtotal + $shippingFee + $tax;

        return [
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'shipping_fee' => round($shippingFee, 2),
            'tax' => round($tax, 2),
            'total' => round($total, 2),
            'item_count' => $items->sum('quantity'),
        ];
    }

    /**
     * Merge guest cart into customer cart when logging in.
     */
    public function mergeGuestCartIntoCustomerCart(string $sessionId, int $customerId, int $shopId): Cart
    {
        return DB::transaction(function () use ($sessionId, $customerId, $shopId) {
            // Get or create customer cart
            $customerCart = $this->getCart(Shop::find($shopId), $customerId);

            // Get guest cart
            $guestCart = Cart::where('session_id', $sessionId)
                ->where('shop_id', $shopId)
                ->first();

            if (!$guestCart) {
                return $customerCart;
            }

            // Merge items
            foreach ($guestCart->items as $guestItem) {
                $existingItem = CartItem::where([
                    'cart_id' => $customerCart->id,
                    'product_variant_id' => $guestItem->product_variant_id,
                    'product_packaging_type_id' => $guestItem->product_packaging_type_id,
                ])->first();

                if ($existingItem) {
                    // Merge quantities
                    $newQuantity = $existingItem->quantity + $guestItem->quantity;
                    $existingItem->update(['quantity' => $newQuantity]);
                } else {
                    // Move item to customer cart
                    $guestItem->update(['cart_id' => $customerCart->id]);
                }
            }

            // Delete guest cart
            $guestCart->delete();

            return $customerCart->fresh(['items.productVariant.product', 'items.packagingType']);
        });
    }

    /**
     * Check if sufficient stock is available.
     */
    protected function checkStockAvailability(ProductVariant $variant, int $requestedQuantity): bool
    {
        // Check if variant is available online
        if (!$variant->is_available_online) {
            return false;
        }

        // Check if we have enough stock
        if ($variant->available_stock < $requestedQuantity) {
            return false;
        }

        // Check max order quantity if set
        if ($variant->max_order_quantity && $requestedQuantity > $variant->max_order_quantity) {
            return false;
        }

        return true;
    }

    /**
     * Calculate shipping fee based on shop settings.
     */
    protected function calculateShipping(Cart $cart, float $subtotal): float
    {
        $shop = $cart->shop;
        $settings = $shop->storefront_settings ?? [];

        $shippingFee = $settings['shipping_fee'] ?? 0;
        $freeShippingThreshold = $settings['free_shipping_threshold'] ?? PHP_FLOAT_MAX;

        return $subtotal >= $freeShippingThreshold ? 0 : $shippingFee;
    }

    /**
     * Calculate tax based on shop location (placeholder for now).
     */
    protected function calculateTax(Cart $cart, float $subtotal): float
    {
        // TODO: Implement tax calculation based on shop location and tax rules
        // For now, return 0 (will be enhanced when tax system is implemented)
        return 0;
    }
}
