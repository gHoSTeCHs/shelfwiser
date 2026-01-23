<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\MaterialOption;
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
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartSummary = $this->cartService->getCartSummary($cart);

        return Inertia::render('Storefront/Cart', [
            'shop' => $shop,
            'cart' => $cart->load([
                'items.productVariant.product',
                'items.packagingType',
                'items.sellable' => function ($morphTo) {
                    $morphTo->morphWith([
                        \App\Models\ServiceVariant::class => ['service'],
                    ]);
                },
            ]),
            'cartSummary' => $cartSummary,
        ]);
    }

    /**
     * Add product item to cart.
     */
    public function store(Request $request, Shop $shop): RedirectResponse
    {
        $validated = $request->validate([
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'packaging_type_id' => ['nullable', 'integer', 'exists:product_packaging_types,id'],
        ]);

        try {
            $cart = $this->cartService->getCart($shop, auth('customer')->id());

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
     * Add service item to cart.
     */
    public function storeService(Request $request, Shop $shop): RedirectResponse
    {
        $validated = $request->validate([
            'service_variant_id' => ['required', 'integer', 'exists:service_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'material_option' => ['nullable', 'string', 'in:customer_materials,shop_materials,none'],
            'selected_addons' => ['nullable', 'array'],
            'selected_addons.*.addon_id' => ['required', 'integer', 'exists:service_addons,id'],
            'selected_addons.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $cart = $this->cartService->getCart($shop, auth('customer')->id());

            // Convert material option string to enum
            $materialOption = isset($validated['material_option'])
                ? MaterialOption::from($validated['material_option'])
                : null;

            // Format selected addons for CartService
            $selectedAddons = $validated['selected_addons'] ?? [];

            $this->cartService->addServiceItem(
                $cart,
                $validated['service_variant_id'],
                $validated['quantity'],
                $materialOption,
                $selectedAddons
            );

            return redirect()->back()->with('success', 'Service added to cart successfully');
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
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
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
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        if ($item->cart_id !== $cart->id) {
            abort(403, 'Unauthorized');
        }

        $this->cartService->removeItem($item);

        return redirect()->back()->with('success', 'Item removed from cart');
    }
}
