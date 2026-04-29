<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\PaymentStatus;
use App\Http\Requests\Storefront\AddServiceToCartApiRequest;
use App\Http\Requests\Storefront\AddToCartApiRequest;
use App\Http\Requests\Storefront\CancelOrderApiRequest;
use App\Http\Requests\Storefront\CustomerLoginRequest;
use App\Http\Requests\Storefront\CustomerRegisterRequest;
use App\Http\Requests\Storefront\CustomerResetPasswordRequest;
use App\Http\Requests\Storefront\CustomerSendResetLinkRequest;
use App\Http\Requests\Storefront\ProcessCheckoutRequest;
use App\Http\Requests\Storefront\UpdateCartItemApiRequest;
use App\Http\Requests\Storefront\UpdateCustomerProfileRequest;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\CustomerAuthService;
use App\Services\CustomerService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class StorefrontApiController extends StorefrontBaseController
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CheckoutService $checkoutService,
        private readonly CustomerAuthService $customerAuthService,
        private readonly CustomerService $customerService,
    ) {}

    public function getCart(Shop $shop): JsonResponse
    {
        $this->ensureCustomerCanAccessShop($shop);
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cart->loadApiCartRelations();
        $summary = $this->cartService->getCartSummary($cart);

        return response()->json([
            'items' => $cart->items->map(fn ($item) => $this->cartService->buildCartItemArray($item))->all(),
            'summary' => [
                'item_count' => $summary['item_count'],
                'subtotal' => $summary['subtotal'],
                'total' => $summary['total'],
            ],
        ]);
    }

    public function addToCart(AddToCartApiRequest $request, Shop $shop): JsonResponse
    {
        $this->ensureCustomerCanAccessShop($shop);
        $cart = $this->cartService->getCart($shop, auth('customer')->id());

        try {
            $cartItem = $this->cartService->addItem(
                $cart,
                $request->validated('variant_id'),
                $request->validated('quantity', 1),
                $request->validated('packaging_type_id')
            );

            $summary = $this->cartService->getCartSummary($cart);

            return response()->json([
                'item' => $this->cartService->buildCartItemArray($cartItem),
                'summary' => [
                    'item_count' => $summary['item_count'],
                    'subtotal' => $summary['subtotal'],
                    'total' => $summary['total'],
                ],
                'message' => 'Item added to cart',
            ]);
        } catch (\Exception $e) {
            Log::error('Cart add item failed', [
                'shop_id' => $shop->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function addServiceToCart(AddServiceToCartApiRequest $request, Shop $shop): JsonResponse
    {
        $this->ensureCustomerCanAccessShop($shop);
        $cart = $this->cartService->getCart($shop, auth('customer')->id());

        try {
            $cartItem = $this->cartService->addServiceItem(
                $cart,
                $request->validated('service_variant_id'),
                $request->validated('quantity', 1),
                $request->materialOption(),
                $request->validated('selected_addons', [])
            );

            return response()->json([
                'item' => $this->cartService->buildCartItemArray($cartItem),
                'message' => 'Service added to cart',
            ]);
        } catch (\Exception $e) {
            Log::error('Cart add service failed', [
                'shop_id' => $shop->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function updateCartItem(UpdateCartItemApiRequest $request, Shop $shop, int $item): JsonResponse
    {
        $this->ensureCustomerCanAccessShop($shop);
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartItem = $cart->items()->findOrFail($item);

        try {
            $this->cartService->updateQuantity($cartItem, $request->validated('quantity'));

            return $this->cartDetailResponse($cart, 'Cart updated');
        } catch (\Exception $e) {
            Log::error('Cart update failed', [
                'shop_id' => $shop->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function removeCartItem(Shop $shop, int $item): JsonResponse
    {
        $this->ensureCustomerCanAccessShop($shop);
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartItem = $cart->items()->findOrFail($item);

        $this->cartService->removeItem($cartItem);

        return $this->cartDetailResponse($cart, 'Item removed');
    }

    public function cartSummary(Shop $shop): JsonResponse
    {
        $this->ensureCustomerCanAccessShop($shop);
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $summary = $this->cartService->getCartSummary($cart);

        return response()->json([
            'subtotal' => $summary['subtotal'],
            'shipping_fee' => $summary['shipping_fee'],
            'tax' => $summary['tax'],
            'total' => $summary['total'],
            'item_count' => $summary['item_count'],
        ]);
    }

    public function login(CustomerLoginRequest $request, Shop $shop): JsonResponse
    {
        $customer = $this->customerAuthService->attemptLogin(
            $request->validated('email'),
            $request->validated('password'),
            $shop->tenant_id
        );

        if (! $customer) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.',
                'errors' => ['email' => ['The provided credentials do not match our records.']],
            ], 422);
        }

        $oldSessionId = session()->getId();

        Auth::guard('customer')->login($customer, $request->boolean('remember'));

        $request->session()->regenerate();

        $this->cartService->mergeGuestCartIntoCustomerCart($oldSessionId, $customer->id, $shop->id);

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
            ],
            'message' => 'Logged in successfully',
        ]);
    }

    public function register(CustomerRegisterRequest $request, Shop $shop): JsonResponse
    {
        $oldSessionId = session()->getId();

        $customer = $this->customerAuthService->register($shop, $request->validated());

        Auth::guard('customer')->login($customer);

        $request->session()->regenerate();

        $this->cartService->mergeGuestCartIntoCustomerCart($oldSessionId, $customer->id, $shop->id);

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
            ],
            'message' => 'Account created successfully',
        ]);
    }

    public function logout(Request $request, Shop $shop): JsonResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }

    public function forgotPassword(CustomerSendResetLinkRequest $request, Shop $shop): JsonResponse
    {
        Password::broker('customers')->sendResetLink(
            array_merge($request->only('email'), ['tenant_id' => $shop->tenant_id])
        );

        return response()->json(['message' => 'If an account exists, a reset link has been sent.']);
    }

    public function resetPassword(CustomerResetPasswordRequest $request, Shop $shop): JsonResponse
    {
        $credentials = array_merge(
            $request->validated(),
            ['tenant_id' => $shop->tenant_id]
        );

        $status = $this->customerAuthService->resetPassword($credentials);

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password has been reset.']);
        }

        return response()->json([
            'message' => __($status),
            'errors' => ['email' => [__($status)]],
        ], 422);
    }

    public function resendVerification(Request $request, Shop $shop): JsonResponse
    {
        $customer = auth('customer')->user();

        if (! $customer || $customer->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        dispatch(fn () => $customer->sendEmailVerificationNotification());

        return response()->json(['message' => 'Verification link sent.']);
    }

    public function processCheckout(ProcessCheckoutRequest $request, Shop $shop): JsonResponse
    {
        $customer = $this->customerForShop($shop);
        $validated = $request->validated();

        if (! empty($validated['idempotency_key'])) {
            $existingOrder = $this->checkoutService->findExistingOrderByIdempotencyKey(
                $validated['idempotency_key'],
                $shop->id,
                $customer->id
            );

            if ($existingOrder) {
                return response()->json([
                    'order' => [
                        'id' => $existingOrder->id,
                        'order_number' => $existingOrder->order_number,
                    ],
                    'redirect_url' => $this->getCheckoutRedirectUrl($existingOrder, $shop),
                    'message' => 'Order already exists',
                ]);
            }
        }

        $cart = $this->cartService->getCart($shop, $customer->id);

        $billingAddress = $validated['billing_same_as_shipping']
            ? $validated['shipping_address']
            : ($validated['billing_address'] ?? $validated['shipping_address']);

        $paymentMethod = \App\Enums\PaymentMethod::from($validated['payment_method']);

        try {
            $order = $this->checkoutService->createOrderFromCart(
                $cart,
                $customer,
                $validated['shipping_address'],
                $billingAddress,
                $validated['payment_method'],
                $validated['customer_notes'] ?? null,
                null,
                $validated['idempotency_key'] ?? null
            );
        } catch (\Exception $e) {
            Log::error('Checkout failed', [
                'shop_id' => $shop->id,
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
            ],
            'redirect_url' => $this->getCheckoutRedirectUrl($order, $shop),
            'requires_payment' => $paymentMethod->requiresOnlineProcessing(),
            'message' => 'Order placed successfully',
        ]);
    }

    public function updateProfile(UpdateCustomerProfileRequest $request, Shop $shop): JsonResponse
    {
        $customer = $this->customerForShop($shop);

        $customer = $this->customerService->updateStorefrontProfile($customer, $request->validated());

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'marketing_opt_in' => $customer->marketing_opt_in,
            ],
            'message' => 'Profile updated',
        ]);
    }

    public function cancelOrder(CancelOrderApiRequest $request, Shop $shop, int $order): JsonResponse
    {
        $customer = $this->customerForShop($shop);

        try {
            $this->checkoutService->cancelByCustomer($order, $customer, $shop, $request->validated('cancellation_reason'));
        } catch (ModelNotFoundException) {
            abort(404);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Order cancelled']);
    }

    private function cartDetailResponse(\App\Models\Cart $cart, string $message): JsonResponse
    {
        $cart->loadApiCartRelations();
        $summary = $this->cartService->getCartSummary($cart);

        return response()->json([
            'items' => $cart->items->map(fn ($item) => $this->cartService->buildCartItemArray($item))->all(),
            'summary' => [
                'item_count' => $summary['item_count'],
                'subtotal' => $summary['subtotal'],
                'total' => $summary['total'],
            ],
            'message' => $message,
        ]);
    }

    private function getCheckoutRedirectUrl(\App\Models\Order $order, Shop $shop): string
    {
        if ($order->payment_status === PaymentStatus::PAID) {
            return route('storefront.checkout.success', [$shop->slug, $order]);
        }

        return route('storefront.checkout.pending', [$shop->slug, $order]);
    }
}
