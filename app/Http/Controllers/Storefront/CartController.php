<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\MaterialOption;
use App\Http\Requests\Storefront\AddServiceToCartApiRequest;
use App\Http\Requests\Storefront\AddToCartApiRequest;
use App\Http\Requests\Storefront\UpdateCartItemApiRequest;
use App\Models\CartItem;
use App\Models\Shop;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends StorefrontBaseController
{
    public function __construct(
        protected CartService $cartService
    ) {}

    /**
     * Display the shopping cart.
     */
    public function index(Shop $shop): Response
    {
        $this->ensureCustomerCanAccessShop($shop);

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
    public function store(AddToCartApiRequest $request, Shop $shop): RedirectResponse
    {
        $this->ensureCustomerCanAccessShop($shop);

        $validated = $request->validated();

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
            Log::error('Cart operation failed', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    /**
     * Add service item to cart.
     */
    public function storeService(AddServiceToCartApiRequest $request, Shop $shop): RedirectResponse
    {
        $this->ensureCustomerCanAccessShop($shop);

        $validated = $request->validated();

        try {
            $cart = $this->cartService->getCart($shop, auth('customer')->id());

            $materialOption = isset($validated['material_option'])
                ? MaterialOption::from($validated['material_option'])
                : null;

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
            Log::error('Cart operation failed', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    /**
     * Update cart item quantity.
     */
    public function update(UpdateCartItemApiRequest $request, Shop $shop, CartItem $item): RedirectResponse
    {
        $this->ensureCustomerCanAccessShop($shop);

        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        if ($item->cart_id !== $cart->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validated();

        try {
            $this->cartService->updateQuantity($item, $validated['quantity']);

            return redirect()->back()->with('success', 'Cart updated successfully');
        } catch (\Exception $e) {
            Log::error('Cart operation failed', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    /**
     * Remove item from cart.
     */
    public function destroy(Shop $shop, CartItem $item): RedirectResponse
    {
        $this->ensureCustomerCanAccessShop($shop);

        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        if ($item->cart_id !== $cart->id) {
            abort(403, 'Unauthorized');
        }

        $this->cartService->removeItem($item);

        return redirect()->back()->with('success', 'Item removed from cart');
    }
}
