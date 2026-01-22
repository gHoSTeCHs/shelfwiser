<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Shop;

class CustomerOrderPolicy
{
    /**
     * Determine whether the customer can view their orders.
     */
    public function viewAny(Customer $customer, Shop $shop): bool
    {
        return $customer->tenant_id === $shop->tenant_id;
    }

    /**
     * Determine whether the customer can view the order.
     */
    public function view(Customer $customer, Order $order, ?Shop $shop = null): bool
    {
        if ($order->customer_id !== $customer->id) {
            return false;
        }

        if ($order->order_type !== OrderType::CUSTOMER) {
            return false;
        }

        if ($shop !== null && $order->shop_id !== $shop->id) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the customer can cancel the order.
     */
    public function cancel(Customer $customer, Order $order): bool
    {
        if ($order->customer_id !== $customer->id) {
            return false;
        }

        if ($order->order_type !== OrderType::CUSTOMER) {
            return false;
        }

        return in_array($order->status, [
            OrderStatus::PENDING,
            OrderStatus::CONFIRMED,
        ]);
    }
}
