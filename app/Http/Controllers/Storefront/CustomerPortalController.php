<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Http\Controllers\Controller;
use App\Http\Requests\CancelOrderRequest;
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

        if ($customer->tenant_id !== $shop->tenant_id) {
            abort(403, 'Unauthorized');
        }

        $stats = [
            'total_orders' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->where('order_type', OrderType::CUSTOMER->value)
                ->count(),
            'pending_orders' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->where('order_type', OrderType::CUSTOMER->value)
                ->where('status', 'pending')
                ->count(),
            'total_spent' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->where('order_type', OrderType::CUSTOMER->value)
                ->where('payment_status', 'paid')
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

        if ($customer->tenant_id !== $shop->tenant_id) {
            abort(403, 'Unauthorized');
        }

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

        if ($customer->tenant_id !== $shop->tenant_id) {
            abort(403, 'Unauthorized');
        }

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

        if ($customer->tenant_id !== $shop->tenant_id) {
            abort(403, 'Unauthorized');
        }

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
    public function updateProfile(Request $request, Shop $shop): RedirectResponse
    {
        $customer = auth('customer')->user();

        if ($customer->tenant_id !== $shop->tenant_id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'marketing_opt_in' => ['boolean'],
        ]);

        $customer->update($validated);

        return back()->with('success', 'Profile updated successfully');
    }

    /**
     * Cancel a customer order.
     */
    public function cancelOrder(CancelOrderRequest $request, Shop $shop, $orderId): RedirectResponse
    {
        $customer = auth('customer')->user();

        if ($customer->tenant_id !== $shop->tenant_id) {
            abort(403, 'Unauthorized');
        }

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
            'cancelled_by' => $customer->id,
        ]);

        return back()->with('success', 'Order cancelled successfully.');
    }
}
