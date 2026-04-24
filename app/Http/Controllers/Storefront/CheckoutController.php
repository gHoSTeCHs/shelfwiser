<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Requests\Storefront\ProcessCheckoutRequest;
use App\Models\Order;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\CheckoutService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        $stockIssues = $this->checkoutService->getCartStockIssues($cartSummary, $shop);

        if (! empty($stockIssues)) {
            return redirect()
                ->route('storefront.cart', $shop->slug)
                ->with('error', 'Some items in your cart are out of stock. Please update quantities: '.implode(', ', $stockIssues));
        }

        return Inertia::render('Storefront/Checkout', [
            'shop' => $shop,
            'cart' => $cart->loadOrderRelations(),
            'cartSummary' => $cartSummary,
            'addresses' => $this->checkoutService->getCustomerAddresses($customer),
            'customer' => $customer,
            'paymentReference' => $this->checkoutService->generatePaymentReference(),
        ]);
    }

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
                $existingOrder = $this->checkoutService->findExistingOrderByIdempotencyKey(
                    $idempotencyKey,
                    $shop->id,
                    $customer->id
                );

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
            $paymentReference = $this->checkoutService->generatePaymentReference();

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
                $this->checkoutService->saveCustomerAddresses(
                    $customer,
                    $validated['shipping_address'],
                    $validated['billing_address'] ?? null,
                    $validated['billing_same_as_shipping']
                );
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

    public function success(Shop $shop, Order $order): Response
    {
        $this->authorizeOrderAccess($order, $shop);

        return Inertia::render('Storefront/CheckoutSuccess', [
            'shop' => $shop,
            'order' => $order->loadOrderRelations(),
        ]);
    }

    public function paymentPending(Shop $shop, Order $order): Response
    {
        $this->authorizeOrderAccess($order, $shop);

        return Inertia::render('Storefront/CheckoutPending', [
            'shop' => $shop,
            'order' => $order->loadOrderRelations(),
        ]);
    }

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

    public function paymentWebhook(Request $request, Shop $shop): JsonResponse
    {
        $paystackSignature = $request->header('x-paystack-signature');

        if (! $paystackSignature) {
            return response()->json(['error' => 'No signature'], 400);
        }

        try {
            if (! $this->checkoutService->verifyWebhookSignature($request->getContent(), $paystackSignature)) {
                Log::warning('Invalid Paystack webhook signature', ['shop_id' => $shop->id]);

                return response()->json(['error' => 'Invalid signature'], 400);
            }
        } catch (RuntimeException $e) {
            return response()->json(['error' => 'Configuration error'], 500);
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
}
