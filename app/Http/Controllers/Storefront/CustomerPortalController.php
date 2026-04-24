<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Requests\Storefront\CancelOrderApiRequest;
use App\Http\Requests\Storefront\UpdateCustomerProfileRequest;
use App\Models\Shop;
use App\Services\CheckoutService;
use App\Services\CustomerPortalService;
use App\Services\CustomerService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPortalController extends StorefrontBaseController
{
    public function __construct(
        private readonly CustomerPortalService $portalService,
        private readonly CustomerService $customerService,
        private readonly CheckoutService $checkoutService,
    ) {}

    /**
     * Display customer dashboard with stats and recent orders.
     */
    public function dashboard(Shop $shop): Response
    {
        $customer = $this->customerForShop($shop);

        return Inertia::render('Storefront/Account/Dashboard', [
            'shop' => $shop,
            'customer' => $customer,
            'stats' => $this->portalService->getDashboardStats($customer, $shop),
            'recentOrders' => $this->portalService->getRecentOrders($customer, $shop),
        ]);
    }

    /**
     * Display paginated order history.
     */
    public function orders(Shop $shop): Response
    {
        $customer = $this->customerForShop($shop);

        return Inertia::render('Storefront/Account/Orders', [
            'shop' => $shop,
            'orders' => $this->portalService->getOrderList($customer, $shop),
        ]);
    }

    /**
     * Display detailed view of a single order.
     */
    public function orderDetail(Shop $shop, int|string $orderId): Response
    {
        $customer = $this->customerForShop($shop);

        return Inertia::render('Storefront/Account/OrderDetail', [
            'shop' => $shop,
            'order' => $this->portalService->getOrderDetail($customer, $shop, $orderId),
        ]);
    }

    /**
     * Display customer profile management page.
     */
    public function profile(Shop $shop): Response
    {
        $customer = $this->portalService->getCustomerProfile($this->customerForShop($shop));

        return Inertia::render('Storefront/Account/Profile', [
            'shop' => $shop,
            'customer' => $customer,
            'addresses' => $customer->addresses,
        ]);
    }

    /**
     * Update customer profile information.
     */
    public function updateProfile(UpdateCustomerProfileRequest $request, Shop $shop): RedirectResponse
    {
        $customer = $this->customerForShop($shop);

        $this->customerService->updateStorefrontProfile($customer, $request->validated());

        return back()->with('success', 'Profile updated successfully');
    }

    /**
     * Cancel a customer order.
     */
    public function cancelOrder(CancelOrderApiRequest $request, Shop $shop, int|string $orderId): RedirectResponse
    {
        $customer = $this->customerForShop($shop);

        try {
            $this->checkoutService->cancelByCustomer(
                (int) $orderId,
                $customer,
                $shop,
                $request->validated('cancellation_reason'),
            );
        } catch (ModelNotFoundException) {
            abort(404);
        } catch (\RuntimeException) {
            return back()->with('error', 'This order cannot be cancelled at its current status.');
        }

        return back()->with('success', 'Order cancelled successfully.');
    }
}
