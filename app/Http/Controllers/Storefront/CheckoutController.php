<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService
    ) {}

    /**
     * Display checkout page with cart summary and saved addresses.
     */
    public function index(Shop $shop): Response|RedirectResponse
    {
        $customer = auth('customer')->user();

        if (!$customer) {
            return redirect()
                ->route('storefront.login', $shop->slug)
                ->with('info', 'Please login to continue with checkout');
        }

        $cart = $this->cartService->getCart($shop, $customer->id);
        $cartSummary = $this->cartService->getCartSummary($cart);

        if ($cartSummary['item_count'] === 0) {
            return redirect()
                ->route('storefront.cart', $shop->slug)
                ->with('error', 'Your cart is empty');
        }

        $addresses = $customer->addresses()->get();

        return Inertia::render('Storefront/Checkout', [
            'shop' => $shop,
            'cart' => $cart->load(['items.productVariant.product', 'items.packagingType']),
            'cartSummary' => $cartSummary,
            'addresses' => $addresses,
            'customer' => $customer,
        ]);
    }

    /**
     * Process checkout request and create order.
     */
    public function process(Request $request, Shop $shop): RedirectResponse
    {
        $customer = auth('customer')->user();

        if (!$customer) {
            return redirect()->route('storefront.login', $shop->slug);
        }

        $validated = $request->validate([
            'shipping_address' => ['required', 'array'],
            'shipping_address.first_name' => ['required', 'string', 'max:255'],
            'shipping_address.last_name' => ['required', 'string', 'max:255'],
            'shipping_address.phone' => ['required', 'string', 'max:50'],
            'shipping_address.address_line_1' => ['required', 'string', 'max:255'],
            'shipping_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'shipping_address.city' => ['required', 'string', 'max:100'],
            'shipping_address.state' => ['required', 'string', 'max:100'],
            'shipping_address.postal_code' => ['nullable', 'string', 'max:20'],
            'shipping_address.country' => ['required', 'string', 'max:100'],

            'billing_same_as_shipping' => ['required', 'boolean'],
            'billing_address' => ['required_if:billing_same_as_shipping,false', 'array'],

            'payment_method' => ['required', 'string', 'in:cash_on_delivery'],
            'customer_notes' => ['nullable', 'string', 'max:500'],
            'save_addresses' => ['boolean'],
        ]);

        try {
            $cart = $this->cartService->getCart($shop, $customer->id);

            $billingAddress = $validated['billing_same_as_shipping']
                ? $validated['shipping_address']
                : $validated['billing_address'];

            $order = $this->checkoutService->createOrderFromCart(
                $cart,
                $customer,
                $validated['shipping_address'],
                $billingAddress,
                $validated['payment_method'],
                $validated['customer_notes'] ?? null
            );

            if ($validated['save_addresses'] ?? false) {
                $this->saveCustomerAddress($customer, $validated['shipping_address'], 'shipping');

                if (!$validated['billing_same_as_shipping']) {
                    $this->saveCustomerAddress($customer, $billingAddress, 'billing');
                }
            }

            return redirect()
                ->route('storefront.checkout.success', [$shop->slug, $order])
                ->with('success', 'Order placed successfully!');

        } catch (\Exception $e) {
            return back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display order confirmation page.
     */
    public function success(Shop $shop, $orderId): Response
    {
        $customer = auth('customer')->user();

        $order = Order::where('id', $orderId)
            ->where('customer_id', $customer->id)
            ->with(['items.productVariant.product', 'items.packagingType'])
            ->firstOrFail();

        return Inertia::render('Storefront/CheckoutSuccess', [
            'shop' => $shop,
            'order' => $order,
        ]);
    }

    /**
     * Save customer address for future use.
     *
     * @param \App\Models\Customer $customer
     * @param array $addressData
     * @param string $type Address type (shipping, billing, both)
     */
    protected function saveCustomerAddress($customer, array $addressData, string $type): void
    {
        $customer->addresses()->create([
            ...$addressData,
            'type' => $type,
            'is_default' => $customer->addresses()->where('type', $type)->count() === 0,
        ]);
    }
}
