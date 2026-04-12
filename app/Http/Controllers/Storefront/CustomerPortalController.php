<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\CancelOrderApiRequest;
use App\Http\Requests\Storefront\UpdateCustomerProfileRequest;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPortalController extends Controller
{
    /**
     * Display customer dashboard with stats and recent orders.
     */
    public function dashboard(Shop $shop): Response
    {
        $customer = auth('customer')->user();

        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        $stats = [
            'total_orders' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->where('order_type', OrderType::CUSTOMER->value)
                ->count(),
            'pending_orders' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->where('order_type', OrderType::CUSTOMER->value)
                ->where('status', OrderStatus::PENDING)
                ->count(),
            'total_spent' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->where('order_type', OrderType::CUSTOMER->value)
                ->where('payment_status', PaymentStatus::PAID)
                ->sum('total_amount'),
        ];

        $recentOrders = $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Storefront/Account/Dashboard', [
            'shop' => $shop,
            'customer' => $customer,
            'stats' => $stats,
            'recentOrders' => $recentOrders,
        ]);
    }

    /**
     * Display paginated order history.
     */
    public function orders(Request $request, Shop $shop): Response
    {
        $customer = auth('customer')->user();

        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        $orders = $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->with(['items.productVariant.product'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Storefront/Account/Orders', [
            'shop' => $shop,
            'orders' => $orders,
        ]);
    }

    /**
     * Display detailed view of a single order.
     */
    public function orderDetail(Shop $shop, $orderId): Response
    {
        $customer = auth('customer')->user();

        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        $order = $customer->orders()
            ->where('id', $orderId)
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->with(['items.productVariant.product', 'items.packagingType'])
            ->firstOrFail();

        return Inertia::render('Storefront/Account/OrderDetail', [
            'shop' => $shop,
            'order' => $order,
        ]);
    }

    /**
     * Display customer profile management page.
     */
    public function profile(Shop $shop): Response
    {
        $customer = auth('customer')->user();

        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        $addresses = $customer->addresses;

        return Inertia::render('Storefront/Account/Profile', [
            'shop' => $shop,
            'customer' => $customer,
            'addresses' => $addresses,
        ]);
    }

    /**
     * Update customer profile information.
     */
    public function updateProfile(UpdateCustomerProfileRequest $request, Shop $shop): RedirectResponse
    {
        $customer = auth('customer')->user();
        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        $customer->update($request->validated());

        return back()->with('success', 'Profile updated successfully');
    }

    /**
     * Cancel a customer order.
     */
    public function cancelOrder(CancelOrderApiRequest $request, Shop $shop, $orderId): RedirectResponse
    {
        $customer = auth('customer')->user();
        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        $order = $customer->orders()
            ->where('id', $orderId)
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->firstOrFail();

        if (! $order->canCancel()) {
            return back()->with('error', 'This order cannot be cancelled at its current status.');
        }

        $order->update([
            'status' => OrderStatus::CANCELLED,
            'cancellation_reason' => $request->validated('cancellation_reason'),
            'cancelled_at' => now(),
        ]);

        return back()->with('success', 'Order cancelled successfully.');
    }
}
