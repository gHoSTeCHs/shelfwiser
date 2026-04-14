<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\CreateOrderRequest;
use App\Http\Requests\RefundOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Requests\UpdatePaymentStatusRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Shop;
use App\Services\OrderRefundService;
use App\Services\OrderService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly OrderRefundService $refundService
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Order::class);

        return Inertia::render('Orders/Index', [
            'orders' => $this->orderService->getPaginatedOrders(),
            'stats' => $this->orderService->getOrderStats(),
            'order_statuses' => OrderStatus::forSelect(),
            'payment_statuses' => PaymentStatus::forSelect(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Order::class);

        return Inertia::render('Orders/Create', [
            'shops' => $this->orderService->getShopsForForm(),
            'products' => $this->orderService->getProductVariantsForCreate(),
        ]);
    }

    /**
     * @throws Throwable
     */
    public function store(CreateOrderRequest $request): RedirectResponse
    {
        Gate::authorize('create', Order::class);

        try {
            $validated = $request->validated();

            $shop = Shop::query()->findOrFail($validated['shop_id']);
            $customer = isset($validated['customer_id'])
                ? Customer::query()->findOrFail($validated['customer_id'])
                : null;

            $order = $this->orderService->createOrder(
                tenant: $request->user()->tenant,
                shop: $shop,
                items: $validated['items'],
                createdBy: $request->user(),
                customer: $customer,
                customerNotes: $validated['customer_notes'] ?? null,
                internalNotes: $validated['internal_notes'] ?? null,
                shippingCost: $validated['shipping_cost'] ?? 0,
                shippingAddress: $validated['shipping_address'] ?? null,
                billingAddress: $validated['billing_address'] ?? null,
            );

            return Redirect::route('orders.show', $order)
                ->with('success', "Order #$order->order_number created successfully.");
        } catch (Exception $e) {
            return Redirect::back()
                ->withInput()
                ->with('error', 'Failed to create order: '.$e->getMessage());
        }
    }

    public function show(Order $order): Response
    {
        Gate::authorize('view', $order);

        $order->loadForShow();

        return Inertia::render('Orders/Show', [
            'order' => $order,
            'can_manage' => auth()->user()->can('manage', $order),
            'order_statuses' => OrderStatus::forSelect(),
            'payment_statuses' => PaymentStatus::forSelect(),
        ]);
    }

    public function edit(Order $order): Response|RedirectResponse
    {
        Gate::authorize('manage', $order);

        if (! $order->canEdit()) {
            return Redirect::route('orders.show', $order)
                ->with('error', 'Order cannot be edited in current status.');
        }

        $order->load(['shop', 'customer', 'items.productVariant.product']);

        return Inertia::render('Orders/Edit', [
            'order' => $order,
            'shops' => $this->orderService->getShopsForForm(),
            'products' => $this->orderService->getProductVariantsForEdit(),
        ]);
    }

    /**
     * @throws Throwable
     */
    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        Gate::authorize('manage', $order);

        try {
            $this->orderService->updateOrder($order, $request->validated());

            return Redirect::route('orders.show', $order)
                ->with('success', "Order #$order->order_number updated successfully.");
        } catch (Exception $e) {
            return Redirect::back()
                ->withInput()
                ->with('error', 'Failed to update order: '.$e->getMessage());
        }
    }

    public function destroy(Order $order): RedirectResponse
    {
        Gate::authorize('delete', $order);

        if ($order->status !== OrderStatus::PENDING) {
            return Redirect::back()
                ->with('error', 'Only pending orders can be deleted.');
        }

        $orderNumber = $order->order_number;
        $order->delete();

        return Redirect::route('orders.index')
            ->with('success', "Order #$orderNumber deleted successfully.");
    }

    /**
     * @throws Throwable
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        Gate::authorize('manage', $order);

        try {
            $newStatus = OrderStatus::from($request->input('status'));

            match ($newStatus) {
                OrderStatus::CONFIRMED => $this->orderService->confirmOrder($order, $request->user()),
                OrderStatus::PROCESSING => $this->orderService->fulfillOrder($order, $request->user()),
                OrderStatus::PACKED => $this->orderService->packOrder($order, $request->user()),
                OrderStatus::SHIPPED => $this->orderService->shipOrder($order, $request->user(), [
                    'tracking_number' => $request->validated('tracking_number'),
                    'carrier' => $request->validated('carrier'),
                    'notes' => $request->validated('notes'),
                ]),
                OrderStatus::DELIVERED => $this->orderService->deliverOrder($order, $request->user(), $request->validated('notes')),
                OrderStatus::CANCELLED => $this->orderService->cancelOrder($order, $request->user(), $request->validated('reason')),
                default => $this->orderService->forceStatus($order, $newStatus),
            };

            return Redirect::back()
                ->with('success', "Order status updated to {$newStatus->label()}.");
        } catch (Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to update order status: '.$e->getMessage());
        }
    }

    /**
     * @throws Throwable
     */
    public function refund(RefundOrderRequest $request, Order $order): RedirectResponse
    {
        Gate::authorize('update', $order);

        try {
            $validated = $request->validated();

            $this->refundService->refundOrder(
                $order,
                $request->user(),
                $validated['reason'],
                $validated['restock_items'] ?? true,
            );

            return Redirect::back()
                ->with('success', 'Order refunded successfully.');
        } catch (Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to refund order: '.$e->getMessage());
        }
    }

    public function updatePaymentStatus(UpdatePaymentStatusRequest $request, Order $order): RedirectResponse
    {
        Gate::authorize('manage', $order);

        try {
            $newStatus = PaymentStatus::from($request->input('payment_status'));

            $this->orderService->updatePaymentStatus(
                $order,
                $newStatus,
                $request->input('payment_method'),
            );

            return Redirect::back()
                ->with('success', "Payment status updated to {$newStatus->label()}.");
        } catch (Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to update payment status: '.$e->getMessage());
        }
    }
}
