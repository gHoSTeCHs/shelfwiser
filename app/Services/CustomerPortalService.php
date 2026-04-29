<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Shop;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CustomerPortalService
{
    public function getDashboardStats(Customer $customer, Shop $shop): array
    {
        $row = $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->selectRaw(
                'count(*) as total_orders,
                 sum(case when status = ? then 1 else 0 end) as pending_orders,
                 sum(case when payment_status = ? then total_amount else 0 end) as total_spent',
                [OrderStatus::PENDING->value, PaymentStatus::PAID->value]
            )
            ->first();

        return [
            'total_orders' => (int) $row->total_orders,
            'pending_orders' => (int) $row->pending_orders,
            'total_spent' => (float) $row->total_spent,
        ];
    }

    public function getRecentOrders(Customer $customer, Shop $shop, int $limit = 5): Collection
    {
        return $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getOrderList(Customer $customer, Shop $shop): LengthAwarePaginator
    {
        return $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->with(['items.productVariant.product'])
            ->latest()
            ->paginate(10);
    }

    public function getOrderDetail(Customer $customer, Shop $shop, int|string $orderId): Order
    {
        return $customer->orders()
            ->where('id', $orderId)
            ->where('shop_id', $shop->id)
            ->where('order_type', OrderType::CUSTOMER->value)
            ->with(['items.productVariant.product', 'items.packagingType'])
            ->firstOrFail();
    }

    public function getCustomerProfile(Customer $customer): Customer
    {
        $customer->load('addresses');

        return $customer;
    }
}
