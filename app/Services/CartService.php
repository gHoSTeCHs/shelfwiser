<?php

namespace App\Services;

use App\Enums\MaterialOption;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\ServiceVariant;
use App\Models\Shop;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;

class CartService
{
    public function __construct(
        private readonly StockMovementService $stockMovementService
    ) {}

    /**
     * Get or create a cart for the current session/customer.
     * Regenerates session ID for new guest carts to prevent session fixation.
     *
     * @throws \InvalidArgumentException If customer does not belong to shop tenant
     */
    public function getCart(Shop $shop, ?int $customerId = null): Cart
    {
        if ($customerId) {
            $customer = Customer::find($customerId);
            if ($customer && $customer->tenant_id !== $shop->tenant_id) {
                throw new \InvalidArgumentException('Customer does not belong to shop tenant');
            }

            $cacheKey = $this->getCartCacheKey($shop->tenant_id, $shop->id, $customerId);

            return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($customerId, $shop) {
                return Cart::firstOrCreate(
                    [
                        'customer_id' => $customerId,
                        'shop_id' => $shop->id,
                    ],
                    [
                        'tenant_id' => $shop->tenant_id,
                        'expires_at' => now()->addDays(30),
                    ]
                );
            });
        }

        $sessionId = Session::getId();
        $cacheKey = $this->getCartCacheKey($shop->tenant_id, $shop->id, null, $sessionId);

        $existingCart = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($sessionId, $shop) {
            return Cart::where('session_id', $sessionId)
                ->where('shop_id', $shop->id)
                ->first();
        });

        if ($existingCart) {
            return $existingCart;
        }

        Session::regenerate();
        $newSessionId = Session::getId();

        $cart = Cart::create([
            'session_id' => $newSessionId,
            'shop_id' => $shop->id,
            'tenant_id' => $shop->tenant_id,
            'expires_at' => now()->addDays(7),
        ]);

        Cache::forget($cacheKey);
        $this->invalidateCartCache($shop->tenant_id, $shop->id, null, $newSessionId);

        return $cart;
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

        $this->validateStockAvailabilityForStorefront($variant, $quantity, $cart->shop_id);

        return DB::transaction(function () use ($cart, $variant, $quantity, $packagingTypeId) {
            $cartItem = CartItem::where([
                'cart_id' => $cart->id,
                'product_variant_id' => $variant->id,
                'product_packaging_type_id' => $packagingTypeId,
            ])->first();

            if ($cartItem) {
                $newQuantity = $cartItem->quantity + $quantity;

                $this->validateStockAvailabilityForStorefront($variant, $newQuantity, $cart->shop_id);

                $cartItem->update(['quantity' => $newQuantity]);
            } else {
                $cartItem = CartItem::create([
                    'cart_id' => $cart->id,
                    'tenant_id' => $cart->tenant_id,
                    'product_variant_id' => $variant->id,
                    'product_packaging_type_id' => $packagingTypeId,
                    'sellable_type' => ProductVariant::class,
                    'sellable_id' => $variant->id,
                    'quantity' => $quantity,
                    'price' => $variant->price,
                ]);
            }

            $cart->touch();

            $this->invalidateCartCache($cart->tenant_id, $cart->shop_id, $cart->customer_id, $cart->session_id);

            return $cartItem->fresh(['productVariant.product', 'packagingType']);
        });
    }

    /**
     * Add a service item to the cart.
     */
    public function addServiceItem(
        Cart $cart,
        int $serviceVariantId,
        int $quantity = 1,
        ?MaterialOption $materialOption = null,
        array $selectedAddons = []
    ): CartItem {
        $variant = ServiceVariant::with('service')->findOrFail($serviceVariantId);

        if (! $variant->service->is_available_online || ! $variant->is_active) {
            throw new \Exception('This service is not available for online booking.');
        }

        return DB::transaction(function () use ($cart, $variant, $quantity, $materialOption, $selectedAddons) {
            $basePrice = $variant->getPriceForMaterialOption($materialOption);
            $totalPrice = $variant->calculateTotalPrice($materialOption, $selectedAddons);

            $cartItem = CartItem::create([
                'cart_id' => $cart->id,
                'tenant_id' => $cart->tenant_id,
                'sellable_type' => ServiceVariant::class,
                'sellable_id' => $variant->id,
                'quantity' => $quantity,
                'price' => $totalPrice,
                'base_price' => $basePrice,
                'material_option' => $materialOption,
                'selected_addons' => $selectedAddons,
            ]);

            $cart->touch();

            $this->invalidateCartCache($cart->tenant_id, $cart->shop_id, $cart->customer_id, $cart->session_id);

            return $cartItem->fresh(['sellable']);
        });
    }

    /**
     * Update cart item quantity.
     */
    public function updateQuantity(CartItem $item, int $quantity): ?CartItem
    {
        $cart = $item->cart;

        if ($quantity <= 0) {
            $item->delete();
            $cart->touch();
            $this->invalidateCartCache($cart->tenant_id, $cart->shop_id, $cart->customer_id, $cart->session_id);

            return null;
        }

        if ($item->isProduct()) {
            $this->validateStockAvailabilityForStorefront($item->productVariant, $quantity, $cart->shop_id);
        }

        $item->update(['quantity' => $quantity]);
        $cart->touch();

        $this->invalidateCartCache($cart->tenant_id, $cart->shop_id, $cart->customer_id, $cart->session_id);

        if ($item->isProduct()) {
            return $item->fresh(['productVariant.product', 'packagingType']);
        } else {
            return $item->fresh(['sellable']);
        }
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(CartItem $item): void
    {
        $cart = $item->cart;
        $item->delete();
        $cart->touch();

        $this->invalidateCartCache($cart->tenant_id, $cart->shop_id, $cart->customer_id, $cart->session_id);
    }

    /**
     * Clear all items from the cart.
     */
    public function clearCart(Cart $cart): void
    {
        $cart->items()->delete();
        $cart->touch();

        $this->invalidateCartCache($cart->tenant_id, $cart->shop_id, $cart->customer_id, $cart->session_id);
    }

    /**
     * Get cart summary with calculations.
     */
    public function getCartSummary(Cart $cart): array
    {
        $cart->load([
            'items.productVariant.product.images',
            'items.packagingType',
            'items.sellable' => function ($morphTo) {
                $morphTo->morphWith([
                    ServiceVariant::class => ['service'],
                ]);
            },
        ]);

        $items = $cart->items;

        $subtotal = $items->sum(fn ($item) => $item->price * $item->quantity);

        $productSubtotal = $items->filter(fn ($item) => $item->isProduct())
            ->sum(fn ($item) => $item->price * $item->quantity);
        $shippingFee = $this->calculateShipping($cart, $productSubtotal);

        $tax = $this->calculateTaxFromItems($cart, $items);
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
     * Regenerates session ID to prevent session fixation attacks.
     */
    public function mergeGuestCartIntoCustomerCart(string $sessionId, int $customerId, int $shopId): Cart
    {
        return DB::transaction(function () use ($sessionId, $customerId, $shopId) {
            $shop = Shop::find($shopId);
            $customerCart = $this->getCart($shop, $customerId);

            $guestCart = Cart::where('session_id', $sessionId)
                ->where('shop_id', $shopId)
                ->first();

            if (! $guestCart) {
                Session::regenerate();

                return $customerCart;
            }

            foreach ($guestCart->items as $guestItem) {
                if ($guestItem->isProduct()) {
                    $existingItem = CartItem::where([
                        'cart_id' => $customerCart->id,
                        'product_variant_id' => $guestItem->product_variant_id,
                        'product_packaging_type_id' => $guestItem->product_packaging_type_id,
                    ])->first();

                    if ($existingItem) {
                        $newQuantity = $existingItem->quantity + $guestItem->quantity;
                        $existingItem->update(['quantity' => $newQuantity]);
                    } else {
                        $guestItem->update(['cart_id' => $customerCart->id]);
                    }
                } else {
                    $guestItem->update(['cart_id' => $customerCart->id]);
                }
            }

            $this->invalidateCartCache($guestCart->tenant_id, $shopId, null, $sessionId);
            $this->invalidateCartCache($customerCart->tenant_id, $shopId, $customerId);

            $guestCart->delete();

            Session::regenerate();

            return $customerCart->fresh([
                'items.productVariant.product',
                'items.packagingType',
                'items.sellable',
            ]);
        });
    }

    /**
     * Validate stock availability for storefront purchases.
     * Includes additional checks for online availability and max order quantity.
     *
     * @throws \Exception
     */
    protected function validateStockAvailabilityForStorefront(ProductVariant $variant, int $requestedQuantity, ?int $shopId = null): void
    {
        if (! $variant->is_available_online) {
            throw new \Exception('This product is not available for online purchase.');
        }

        if ($variant->max_order_quantity && $requestedQuantity > $variant->max_order_quantity) {
            throw new \Exception("Maximum order quantity for this product is {$variant->max_order_quantity} units.");
        }

        if (! ($variant->product->track_stock ?? true)) {
            return;
        }

        if (! $this->stockMovementService->checkStockAvailability($variant, $requestedQuantity, $shopId)) {
            $available = $this->stockMovementService->getAvailableStock($variant, $shopId);
            throw new \Exception("Insufficient stock available. Only {$available} units in stock.");
        }
    }

    /**
     * Calculate shipping fee based on shop settings.
     */
    protected function calculateShipping(Cart $cart, float $subtotal): float
    {
        $shop = $cart->shop;
        $settings = $shop->storefront_settings ?? [];

        $shippingFee = $settings['shipping_fee'] ?? 0;
        $freeShippingThreshold = $settings['free_shipping_threshold'] ?? null;

        // If free shipping threshold is set and subtotal meets it, shipping is free
        if ($freeShippingThreshold !== null && $subtotal >= $freeShippingThreshold) {
            return 0;
        }

        return $shippingFee;
    }

    /**
     * Calculate tax based on shop VAT settings and product taxability.
     * Uses the same logic as POSService for consistency.
     */
    protected function calculateTax(Cart $cart, float $subtotal): float
    {
        $items = $cart->items()->with(['productVariant.product'])->get();

        return $this->calculateTaxFromItems($cart, $items);
    }

    /**
     * Calculate tax from pre-loaded items collection.
     * Avoids duplicate queries when items are already loaded.
     */
    protected function calculateTaxFromItems(Cart $cart, $items): float
    {
        $shop = $cart->shop;

        if (! ($shop->vat_enabled ?? false)) {
            return 0;
        }

        $vatRate = $shop->vat_rate ?? 0;
        if ($vatRate <= 0) {
            return 0;
        }

        $taxAmount = 0;

        foreach ($items as $item) {
            if ($item->isProduct() && ($item->productVariant->product->is_taxable ?? false)) {
                $itemTotal = $item->price * $item->quantity;
                $taxAmount += $itemTotal * ($vatRate / 100);
            }
        }

        return round($taxAmount, 2);
    }

    /**
     * Generate tenant-aware cart cache key.
     */
    protected function getCartCacheKey(int $tenantId, int $shopId, ?int $customerId = null, ?string $sessionId = null): string
    {
        if ($customerId) {
            return "tenant:{$tenantId}:shop:{$shopId}:cart:customer:{$customerId}";
        }

        return "tenant:{$tenantId}:shop:{$shopId}:cart:session:{$sessionId}";
    }

    /**
     * Generate tenant-aware cart summary cache key.
     */
    protected function getCartSummaryCacheKey(int $tenantId, int $cartId): string
    {
        return "tenant:{$tenantId}:cart:{$cartId}:summary";
    }

    /**
     * Invalidate cart cache when cart is modified.
     */
    protected function invalidateCartCache(int $tenantId, int $shopId, ?int $customerId = null, ?string $sessionId = null): void
    {
        $cacheKey = $this->getCartCacheKey($tenantId, $shopId, $customerId, $sessionId);
        Cache::forget($cacheKey);

        if ($customerId) {
            $cart = Cart::where('customer_id', $customerId)
                ->where('shop_id', $shopId)
                ->first();

            if ($cart) {
                Cache::forget($this->getCartSummaryCacheKey($tenantId, $cart->id));
            }
        } elseif ($sessionId) {
            $cart = Cart::where('session_id', $sessionId)
                ->where('shop_id', $shopId)
                ->first();

            if ($cart) {
                Cache::forget($this->getCartSummaryCacheKey($tenantId, $cart->id));
            }
        }
    }
}
