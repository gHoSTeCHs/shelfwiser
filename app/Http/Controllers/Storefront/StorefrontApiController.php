<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\MaterialOption;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
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
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class StorefrontApiController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CheckoutService $checkoutService,
    ) {}

    public function addToCart(AddToCartApiRequest $request, Shop $shop): JsonResponse
    {
        $cart = $this->cartService->getCart($shop, auth('customer')->id());

        try {
            $cartItem = $this->cartService->addItem(
                $cart,
                $request->validated('variant_id'),
                $request->validated('quantity', 1),
                $request->validated('packaging_type_id')
            );

            $cartItem->load(['productVariant.product', 'sellable']);

            return response()->json([
                'item' => $this->serializeCartItem($cartItem),
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
        $cart = $this->cartService->getCart($shop, auth('customer')->id());

        $materialOption = $request->validated('material_option')
            ? MaterialOption::from($request->validated('material_option'))
            : null;

        try {
            $cartItem = $this->cartService->addServiceItem(
                $cart,
                $request->validated('service_variant_id'),
                $request->validated('quantity', 1),
                $materialOption,
                $request->validated('selected_addons', [])
            );

            $cartItem->load(['productVariant.product', 'sellable']);

            return response()->json([
                'item' => $this->serializeCartItem($cartItem),
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
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartItem = $cart->items()->findOrFail($item);

        try {
            $updated = $this->cartService->updateQuantity($cartItem, $request->validated('quantity'));

            if ($updated === null) {
                return response()->json(['message' => 'Item removed from cart']);
            }

            return response()->json([
                'item' => $this->serializeCartItem($updated),
                'message' => 'Cart updated',
            ]);
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
        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartItem = $cart->items()->findOrFail($item);

        $this->cartService->removeItem($cartItem);

        return response()->json(['message' => 'Item removed']);
    }

    public function cartSummary(Shop $shop): JsonResponse
    {
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
        $customer = Customer::query()
            ->where('email', $request->validated('email'))
            ->where('tenant_id', $shop->tenant_id)
            ->where('is_active', true)
            ->first();

        if (! $customer || ! Hash::check($request->validated('password'), $customer->password)) {
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

        $customer = Customer::query()->create([
            'tenant_id' => $shop->tenant_id,
            'preferred_shop_id' => $shop->id,
            'first_name' => $request->validated('first_name'),
            'last_name' => $request->validated('last_name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'password' => Hash::make($request->validated('password')),
            'marketing_opt_in' => (bool) $request->validated('marketing_opt_in', false),
        ]);

        event(new Registered($customer));

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
        $status = Password::broker('customers')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($customer, $password) {
                $customer->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));
                $customer->save();

                event(new \Illuminate\Auth\Events\PasswordReset($customer));
            }
        );

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

        $customer->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    public function processCheckout(ProcessCheckoutRequest $request, Shop $shop): JsonResponse
    {
        $customer = auth('customer')->user();
        $validated = $request->validated();

        if (! empty($validated['idempotency_key'])) {
            $existingOrder = Order::query()
                ->where('offline_id', $validated['idempotency_key'])
                ->where('shop_id', $shop->id)
                ->where('customer_id', $customer->id)
                ->first();

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

        if ($cart->items()->count() === 0) {
            return response()->json(['message' => 'Your cart is empty.'], 422);
        }

        $billingAddress = $validated['billing_same_as_shipping']
            ? $validated['shipping_address']
            : $validated['billing_address'];

        $paymentMethod = PaymentMethod::from($validated['payment_method']);

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
        $customer = auth('customer')->user();
        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        $customer->update($request->validated());

        $customer->refresh();

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
        $customer = auth('customer')->user();

        $orderModel = $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->findOrFail($order);

        if (! $orderModel->canCancel()) {
            return response()->json(['message' => 'This order cannot be cancelled.'], 422);
        }

        $orderModel->update([
            'status' => OrderStatus::CANCELLED,
            'cancellation_reason' => $request->validated('cancellation_reason'),
            'cancelled_at' => now(),
        ]);

        return response()->json(['message' => 'Order cancelled']);
    }

    private function serializeCartItem(CartItem $item): array
    {
        $item->loadMissing(['productVariant.product', 'sellable']);

        return [
            'id' => $item->id,
            'name' => $item->productVariant?->product?->name ?? $item->sellable?->name ?? '',
            'variant_name' => $item->productVariant?->name,
            'price' => (float) $item->price,
            'quantity' => $item->quantity,
            'image' => $item->productVariant?->product?->primary_image_url ?? null,
            'max_quantity' => $item->productVariant?->stock_quantity,
        ];
    }

    private function getCheckoutRedirectUrl(Order $order, Shop $shop): string
    {
        if ($order->payment_status === PaymentStatus::PAID) {
            return route('storefront.checkout.success', [$shop->slug, $order]);
        }

        return route('storefront.checkout.pending', [$shop->slug, $order]);
    }
}
