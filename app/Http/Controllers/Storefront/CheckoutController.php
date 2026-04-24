<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Requests\Storefront\ProcessCheckoutRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\ServiceVariant;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\CheckoutService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class CheckoutController extends StorefrontBaseController
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
            $variants = ProductVariant::query()
                ->whereIn('id', $productVariantIds)
                ->whereHas('product', fn ($q) => $q->where('shop_id', $shop->id))
                ->with(['inventoryLocations', 'product'])
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
                    $stockIssues[] = "{$variant->product->name} - Only $variant->available_stock available (you have $item->quantity in cart)";
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
                'items.sellable' => function ($morphTo) {
                    $morphTo->morphWith([
                        ServiceVariant::class => ['service'],
                    ]);
                },
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
    public function process(ProcessCheckoutRequest $request, Shop $shop): RedirectResponse
    {
        $customer = auth('customer')->user();

        if (! $customer) {
            return redirect()->route('storefront.login', $shop->slug);
        }

        $validated = $request->validated();

        try {
            $idempotencyKey = $validated['idempotency_key'] ?? null;

            if ($idempotencyKey) {
                $existingOrder = Order::query()->where('offline_id', $idempotencyKey)
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
            $paymentReference = $this->generatePaymentReference($shop);

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

        } catch (Exception $e) {
            Log::error('Checkout failed', ['shop_id' => $shop->id, 'error_type' => get_class($e), 'error' => $e->getMessage()]);
            report($e);

            return back()
                ->with('error', 'Something went wrong while processing your order. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display order confirmation page.
     */
    public function success(Shop $shop, Order $order): Response
    {
        $this->authorizeOrderAccess($order, $shop);

        $order->load([
            'items.productVariant.product',
            'items.packagingType',
            'items.sellable' => function ($morphTo) {
                $morphTo->morphWith([
                    ServiceVariant::class => ['service'],
                ]);
            },
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
        $this->authorizeOrderAccess($order, $shop);

        $order->load([
            'items.productVariant.product',
            'items.packagingType',
            'items.sellable' => function ($morphTo) {
                $morphTo->morphWith([
                    ServiceVariant::class => ['service'],
                ]);
            },
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

            if ($order && $order->payment_status === PaymentStatus::PAID) {
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

        } catch (Exception $e) {
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
    public function paymentWebhook(Request $request, Shop $shop): JsonResponse
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
            $reference = $data['reference'] ?? null;
            $eventId = $data['id'] ?? null;

            if (! $reference) {
                Log::warning('Paystack webhook missing reference', ['shop_id' => $shop->id]);

                return response()->json(['error' => 'Missing reference'], 400);
            }

            try {
                $this->checkoutService->updatePaymentStatus(
                    $reference,
                    PaymentStatus::PAID,
                    $eventId,
                    ($data['amount'] ?? 0) / 100
                );
            } catch (RuntimeException $e) {
                Log::warning('Paystack webhook rejected', [
                    'event' => $event,
                    'reference' => $reference,
                    'reason' => $e->getMessage(),
                ]);

                return response()->json(['error' => $e->getMessage()], 422);
            } catch (Throwable $e) {
                Log::error('Paystack webhook processing error', [
                    'event' => $event,
                    'reference' => $reference,
                    'error' => $e->getMessage(),
                ]);

                return response()->json(['error' => 'Internal error'], 500);
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Save customer address for future use.
     *
     * @param  Customer  $customer
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
