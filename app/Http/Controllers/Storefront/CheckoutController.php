<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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

        if (! $customer) {
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

        $productVariantIds = $cartSummary['items']
            ->filter(fn ($item) => $item->isProduct())
            ->pluck('product_variant_id')
            ->unique();

        if ($productVariantIds->isNotEmpty()) {
            $variants = ProductVariant::whereIn('id', $productVariantIds)
                ->with('inventoryLocations')
                ->get()
                ->keyBy('id');
        } else {
            $variants = collect();
        }

        $stockIssues = [];
        foreach ($cartSummary['items'] as $item) {
            if ($item->isProduct()) {
                $variant = $variants->get($item->product_variant_id);
                if ($variant && $variant->available_stock < $item->quantity) {
                    $stockIssues[] = "{$variant->product->name} - Only {$variant->available_stock} available (you have {$item->quantity} in cart)";
                }
            }
        }

        if (! empty($stockIssues)) {
            return redirect()
                ->route('storefront.cart', $shop->slug)
                ->with('error', 'Some items in your cart are out of stock. Please update quantities: '.implode(', ', $stockIssues));
        }

        $addresses = $customer->addresses()->get();
        $paymentReference = $this->generatePaymentReference($shop);

        return Inertia::render('Storefront/Checkout', [
            'shop' => $shop,
            'cart' => $cart->load([
                'items.productVariant.product',
                'items.packagingType',
                'items.sellable.service',
            ]),
            'cartSummary' => $cartSummary,
            'addresses' => $addresses,
            'customer' => $customer,
            'paymentReference' => $paymentReference,
        ]);
    }

    /**
     * Generate a unique payment reference for the order.
     * Uses UUID for high entropy and unpredictability.
     * Format: PAY-{UUID}
     */
    protected function generatePaymentReference(Shop $shop): string
    {
        return 'PAY-'.Str::uuid()->toString();
    }

    /**
     * Process checkout request and create order.
     */
    public function process(Request $request, Shop $shop): RedirectResponse
    {
        $customer = auth('customer')->user();

        if (! $customer) {
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

            'payment_method' => ['required', 'string', Rule::in(PaymentMethod::storefrontValues())],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
            'customer_notes' => ['nullable', 'string', 'max:500'],
            'save_addresses' => ['boolean'],
        ]);

        try {
            $idempotencyKey = $validated['idempotency_key'] ?? null;

            if ($idempotencyKey) {
                $existingOrder = Order::where('offline_id', $idempotencyKey)
                    ->where('shop_id', $shop->id)
                    ->where('customer_id', $customer->id)
                    ->first();

                if ($existingOrder) {
                    $paymentMethod = PaymentMethod::from($validated['payment_method']);

                    if ($paymentMethod->requiresOnlineProcessing()) {
                        return redirect()
                            ->route('storefront.checkout.pending', [$shop->slug, $existingOrder])
                            ->with('info', 'Please complete your payment.');
                    }

                    return redirect()
                        ->route('storefront.checkout.success', [$shop->slug, $existingOrder])
                        ->with('success', 'Order placed successfully!');
                }
            }

            $cart = $this->cartService->getCart($shop, $customer->id);

            $billingAddress = $validated['billing_same_as_shipping']
                ? $validated['shipping_address']
                : $validated['billing_address'];

            $paymentMethod = PaymentMethod::from($validated['payment_method']);
            $paymentReference = $validated['payment_reference'] ?? $this->generatePaymentReference($shop);

            $order = $this->checkoutService->createOrderFromCart(
                $cart,
                $customer,
                $validated['shipping_address'],
                $billingAddress,
                $validated['payment_method'],
                $validated['customer_notes'] ?? null,
                $paymentReference,
                $idempotencyKey
            );

            if ($validated['save_addresses'] ?? false) {
                $this->saveCustomerAddress($customer, $validated['shipping_address'], 'shipping');

                if (! $validated['billing_same_as_shipping']) {
                    $this->saveCustomerAddress($customer, $billingAddress, 'billing');
                }
            }

            if ($paymentMethod->requiresOnlineProcessing()) {
                return redirect()
                    ->route('storefront.checkout.pending', [$shop->slug, $order])
                    ->with('info', 'Please complete your payment.');
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
    public function success(Shop $shop, Order $order): Response
    {
        $customer = auth('customer')->user();

        if ($order->customer_id !== $customer->id) {
            abort(403, 'Unauthorized');
        }

        if ($order->shop_id !== $shop->id) {
            abort(404);
        }

        $order->load([
            'items.productVariant.product',
            'items.packagingType',
            'items.sellable.service',
        ]);

        return Inertia::render('Storefront/CheckoutSuccess', [
            'shop' => $shop,
            'order' => $order,
        ]);
    }

    /**
     * Display payment pending page for orders awaiting payment confirmation.
     */
    public function paymentPending(Shop $shop, Order $order): Response
    {
        $customer = auth('customer')->user();

        if ($order->customer_id !== $customer->id) {
            abort(403, 'Unauthorized');
        }

        if ($order->shop_id !== $shop->id) {
            abort(404);
        }

        $order->load([
            'items.productVariant.product',
            'items.packagingType',
            'items.sellable.service',
        ]);

        return Inertia::render('Storefront/CheckoutPending', [
            'shop' => $shop,
            'order' => $order,
        ]);
    }

    /**
     * Handle Paystack payment callback (redirect from Paystack).
     */
    public function paymentCallback(Request $request, Shop $shop): RedirectResponse
    {
        $reference = $request->query('reference');
        $trxref = $request->query('trxref');

        if (! $reference && ! $trxref) {
            return redirect()
                ->route('storefront.index', $shop->slug)
                ->with('error', 'Invalid payment callback');
        }

        $paymentReference = $reference ?? $trxref;

        try {
            $order = $this->checkoutService->verifyPaystackPayment($paymentReference, $shop);

            if ($order && $order->payment_status === PaymentStatus::PAID->value) {
                return redirect()
                    ->route('storefront.checkout.success', [$shop->slug, $order])
                    ->with('success', 'Payment successful! Your order has been confirmed.');
            }

            if ($order) {
                return redirect()
                    ->route('storefront.checkout.pending', [$shop->slug, $order])
                    ->with('info', 'Payment is being processed. We will notify you once confirmed.');
            }

            return redirect()
                ->route('storefront.index', $shop->slug)
                ->with('error', 'Unable to verify payment. Please contact support.');

        } catch (\Exception $e) {
            Log::error('Payment callback error', [
                'reference' => $paymentReference,
                'shop_id' => $shop->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->route('storefront.index', $shop->slug)
                ->with('error', 'Payment verification failed. Please contact support.');
        }
    }

    /**
     * Handle Paystack webhook notifications.
     */
    public function paymentWebhook(Request $request, Shop $shop): \Illuminate\Http\JsonResponse
    {
        $paystackSignature = $request->header('x-paystack-signature');

        if (! $paystackSignature) {
            return response()->json(['error' => 'No signature'], 400);
        }

        $payload = $request->getContent();
        $secretKey = config('services.paystack.secret_key');

        if (! $secretKey) {
            Log::error('Paystack secret key not configured');

            return response()->json(['error' => 'Configuration error'], 500);
        }

        $computedSignature = hash_hmac('sha512', $payload, $secretKey);

        if (! hash_equals($computedSignature, $paystackSignature)) {
            Log::warning('Invalid Paystack webhook signature', [
                'shop_id' => $shop->id,
            ]);

            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'charge.success') {
            try {
                $reference = $data['reference'] ?? null;
                if ($reference) {
                    $this->checkoutService->updatePaymentStatus(
                        $reference,
                        PaymentStatus::PAID,
                        $data['id'] ?? null
                    );
                }
            } catch (\Exception $e) {
                Log::error('Webhook processing error', [
                    'event' => $event,
                    'reference' => $data['reference'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Save customer address for future use.
     *
     * @param  \App\Models\Customer  $customer
     * @param  string  $type  Address type (shipping, billing, both)
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
