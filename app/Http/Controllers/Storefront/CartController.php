<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Shop;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    /**
     * Display the shopping cart.
     */
    public function index(Shop $shop): Response
    {
        $cart = $this->cartService->getCart($shop, auth()->id());
        $cartSummary = $this->cartService->getCartSummary($cart);

        return Inertia::render('Storefront/Cart', [
            'shop' => $shop,
            'cart' => $cart->load(['items.productVariant.product', 'items.packagingType']),
            'cartSummary' => $cartSummary,
        ]);
    }

    /**
     * Add item to cart.
     */
    public function store(Request $request, Shop $shop): RedirectResponse
    {
        $validated = $request->validate([
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'packaging_type_id' => ['nullable', 'integer', 'exists:product_packaging_types,id'],
        ]);

        try {
            $cart = $this->cartService->getCart($shop, auth()->id());

            $this->cartService->addItem(
                $cart,
                $validated['variant_id'],
                $validated['quantity'],
                $validated['packaging_type_id'] ?? null
            );

            return redirect()->back()->with('success', 'Item added to cart successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Update cart item quantity.
     */
    public function update(Request $request, Shop $shop, CartItem $item): RedirectResponse
    {
        // Ensure cart item belongs to current cart
        $cart = $this->cartService->getCart($shop, auth()->id());
        if ($item->cart_id !== $cart->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
        ]);

        try {
            $this->cartService->updateQuantity($item, $validated['quantity']);

            return redirect()->back()->with('success', 'Cart updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Remove item from cart.
     */
    public function destroy(Shop $shop, CartItem $item): RedirectResponse
    {
        // Ensure cart item belongs to current cart
        $cart = $this->cartService->getCart($shop, auth()->id());
        if ($item->cart_id !== $cart->id) {
            abort(403, 'Unauthorized');
        }

        $this->cartService->removeItem($item);

        return redirect()->back()->with('success', 'Item removed from cart');
    }
}
