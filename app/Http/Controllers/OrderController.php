<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\CreateOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Requests\UpdatePaymentStatusRequest;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Shop;
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
    public function __construct(private readonly OrderService $orderService)
    {
    }

    public function index(): Response
    {
        Gate::authorize('viewAny', Order::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Orders/Index', [
            'orders' => Order::where('tenant_id', $tenantId)
                ->with(['shop', 'customer', 'items', 'createdBy'])
                ->withCount('items')
                ->latest()
                ->paginate(20),
            'stats' => [
                'total' => Order::where('tenant_id', $tenantId)->count(),
                'pending' => Order::where('tenant_id', $tenantId)
                    ->where('status', OrderStatus::PENDING)
                    ->count(),
                'confirmed' => Order::where('tenant_id', $tenantId)
                    ->where('status', OrderStatus::CONFIRMED)
                    ->count(),
                'delivered' => Order::where('tenant_id', $tenantId)
                    ->where('status', OrderStatus::DELIVERED)
                    ->count(),
            ],
            'order_statuses' => OrderStatus::forSelect(),
            'payment_statuses' => PaymentStatus::forSelect(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Order::class);

        $tenantId = auth()->user()->tenant_id;

        $shops = Shop::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'name', 'slug']);

        $products = ProductVariant::query()
            ->whereHas('product', function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)
                    ->where('is_active', true);
            })
            ->with(['product.shop', 'inventoryLocations'])
            ->get();

        return Inertia::render('Orders/Create', [
            'shops' => $shops,
            'products' => $products,
        ]);
    }

    /**
     * @throws Throwable
     */
    public function store(CreateOrderRequest $request): RedirectResponse
    {
        try {
            $shop = Shop::findOrFail($request->input('shop_id'));
            $customer = $request->input('customer_id')
                ? \App\Models\User::findOrFail($request->input('customer_id'))
                : null;

            $order = $this->orderService->createOrder(
                tenant: $request->user()->tenant,
                shop: $shop,
                items: $request->input('items'),
                createdBy: $request->user(),
                customer: $customer,
                customerNotes: $request->input('customer_notes'),
                internalNotes: $request->input('internal_notes'),
                shippingCost: $request->input('shipping_cost', 0),
                shippingAddress: $request->input('shipping_address'),
                billingAddress: $request->input('billing_address')
            );

            return Redirect::route('orders.show', $order)
                ->with('success', "Order #{$order->order_number} created successfully.");
        } catch (Exception $e) {
            return Redirect::back()
                ->withInput()
                ->with('error', 'Failed to create order: ' . $e->getMessage());
        }
    }

    public function show(Order $order): Response
    {
        Gate::authorize('view', $order);

        $order->load([
            'shop',
            'customer',
            'items.productVariant.product',
            'items.productVariant.inventoryLocations.location',
            'createdBy'
        ]);

        return Inertia::render('Orders/Show', [
            'order' => $order,
            'can_manage' => auth()->user()->can('manage', $order),
            'order_statuses' => OrderStatus::forSelect(),
            'payment_statuses' => PaymentStatus::forSelect(),
        ]);
    }

    public function edit(Order $order): Response
    {
        Gate::authorize('manage', $order);

        if (!$order->canEdit()) {
            return Redirect::route('orders.show', $order)
                ->with('error', 'Order cannot be edited in current status.');
        }

        $order->load(['shop', 'customer', 'items.productVariant.product']);

        $tenantId = auth()->user()->tenant_id;

        $shops = Shop::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'name', 'slug']);

        $products = ProductVariant::query()
            ->whereHas('product', function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)
                    ->where('is_active', true);
            })
            ->with(['product.shop', 'inventoryLocations'])
            ->get();

        return Inertia::render('Orders/Edit', [
            'order' => $order,
            'shops' => $shops,
            'products' => $products,
        ]);
    }

    /**
     * @throws Throwable
     */
    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        try {
            $this->orderService->updateOrder($order, $request->validated());

            return Redirect::route('orders.show', $order)
                ->with('success', "Order #{$order->order_number} updated successfully.");
        } catch (Exception $e) {
            return Redirect::back()
                ->withInput()
                ->with('error', 'Failed to update order: ' . $e->getMessage());
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
            ->with('success', "Order #{$orderNumber} deleted successfully.");
    }

    /**
     * @throws Throwable
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        try {
            $newStatus = OrderStatus::from($request->input('status'));

            if ($newStatus === OrderStatus::CONFIRMED) {
                $this->orderService->confirmOrder($order, $request->user());
            } elseif ($newStatus === OrderStatus::PROCESSING) {
                $this->orderService->fulfillOrder($order, $request->user());
            } elseif ($newStatus === OrderStatus::CANCELLED) {
                $this->orderService->cancelOrder(
                    $order,
                    $request->user(),
                    $request->input('reason')
                );
            } else {
                if (!$order->status->canTransitionTo($newStatus)) {
                    throw new Exception("Cannot change status from {$order->status->value} to {$newStatus->value}");
                }
                $order->status = $newStatus;
                $order->save();
            }

            return Redirect::back()
                ->with('success', "Order status updated to {$newStatus->label()}.");
        } catch (Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to update order status: ' . $e->getMessage());
        }
    }

    public function updatePaymentStatus(UpdatePaymentStatusRequest $request, Order $order): RedirectResponse
    {
        try {
            $newStatus = PaymentStatus::from($request->input('payment_status'));

            $this->orderService->updatePaymentStatus(
                $order,
                $newStatus,
                $request->input('payment_method')
            );

            return Redirect::back()
                ->with('success', "Payment status updated to {$newStatus->label()}.");
        } catch (Exception $e) {
            return Redirect::back()
                ->with('error', 'Failed to update payment status: ' . $e->getMessage());
        }
    }
}
