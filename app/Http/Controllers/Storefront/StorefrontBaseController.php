<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Shop;

class StorefrontBaseController extends Controller
{
    protected function customer(): Customer
    {
        return auth('customer')->user()
            ?? abort(401, 'Authentication required');
    }

    protected function customerForShop(Shop $shop): Customer
    {
        $customer = $this->customer();

        abort_unless($customer->tenant_id === $shop->tenant_id, 403);

        return $customer;
    }

    /**
     * Enforce shop tenant binding for the current request.
     * For authenticated customers, the shop must belong to their tenant.
     * Guests are allowed through (the cart is bound to the session, not a tenant).
     */
    protected function ensureCustomerCanAccessShop(Shop $shop): void
    {
        if (auth('customer')->check()) {
            $this->customerForShop($shop);
        }
    }

    protected function authorizeOrderAccess(Order $order, Shop $shop): void
    {
        abort_unless($order->customer_id === $this->customer()->id, 403, 'Unauthorized');
        abort_unless($order->shop_id === $shop->id, 404);
    }
}
