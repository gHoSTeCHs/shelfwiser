<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    public function getDashboardMetrics(
        User    $user,
        ?int    $shopId = null,
        string  $period = 'today',
        ?string $startDate = null,
        ?string $endDate = null
    ): array
    {
        $shopIds = $this->getAccessibleShopIds($user, $shopId);
        $dateRange = $this->getDateRange($period, $startDate, $endDate);

        return [
            'sales' => $this->getSalesMetrics($shopIds, $dateRange['start'], $dateRange['end']),
            'orders' => $this->getOrderMetrics($shopIds, $dateRange['start'], $dateRange['end']),
            'top_products' => $this->getTopProducts($shopIds, $dateRange['start'], $dateRange['end']),
            'recent_orders' => $this->getRecentOrders($shopIds, 10),
            'low_stock' => $this->getLowStockAlerts($shopIds),
            'chart_data' => $this->getSalesChartData($shopIds, $dateRange['start'], $dateRange['end']),
        ];
    }

    protected function getAccessibleShopIds(User $user, ?int $shopId = null): Collection
    {
        if ($user->is_tenant_owner) {
            $query = Shop::query()->where('tenant_id', $user->tenant_id);

            if ($shopId) {
                $query->where('id', $shopId);
            }

            return $query->pluck('id');
        }

        $assignedShopIds = $user->shops()->pluck('shops.id');

        if ($shopId) {
            if (!$assignedShopIds->contains($shopId)) {
                abort(403, 'You do not have access to this shop');
            }
            return collect([$shopId]);
        }

        return $assignedShopIds;
    }

    public function getDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
        if ($period === 'custom' && $startDate && $endDate) {
            return [
                'start' => Carbon::parse($startDate)->startOfDay(),
                'end' => Carbon::parse($endDate)->endOfDay(),
            ];
        }

        return match ($period) {
            'week' => [
                'start' => now()->startOfWeek(),
                'end' => now()->endOfWeek(),
            ],
            'month' => [
                'start' => now()->startOfMonth(),
                'end' => now()->endOfMonth(),
            ],
            default => [
                'start' => now()->startOfDay(),
                'end' => now()->endOfDay(),
            ],
        };
    }

    public function getSalesMetrics(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $cacheKey = "dashboard:sales:{$shopIds->implode(',')}:{$start->format('Ymd')}:{$end->format('Ymd')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(5), function () use ($shopIds, $start, $end) {
            $metrics = Order::query()->whereIn('shop_id', $shopIds)
                ->whereBetween('created_at', [$start, $end])
                ->whereNotIn('status', [OrderStatus::CANCELLED])
                ->selectRaw('
                    SUM(total_amount) as total_revenue,
                    SUM(subtotal) as subtotal,
                    SUM(tax_amount) as tax_amount,
                    SUM(discount_amount) as discount_amount,
                    SUM(shipping_cost) as shipping_cost,
                    AVG(total_amount) as avg_order_value
                ')
                ->first();

            $periodDays = $start->diffInDays($end) + 1;
            $previousStart = $start->copy()->subDays($periodDays);
            $previousEnd = $end->copy()->subDays($periodDays);

            $previousMetrics = Order::query()->whereIn('shop_id', $shopIds)
                ->whereBetween('created_at', [$previousStart, $previousEnd])
                ->whereNotIn('status', [OrderStatus::CANCELLED])
                ->sum('total_amount');

            $trend = 0;
            if ($previousMetrics > 0) {
                $trend = (($metrics->total_revenue - $previousMetrics) / $previousMetrics) * 100;
            }

            return [
                'total_revenue' => (float)($metrics->total_revenue ?? 0),
                'subtotal' => (float)($metrics->subtotal ?? 0),
                'tax_amount' => (float)($metrics->tax_amount ?? 0),
                'discount_amount' => (float)($metrics->discount_amount ?? 0),
                'shipping_cost' => (float)($metrics->shipping_cost ?? 0),
                'avg_order_value' => (float)($metrics->avg_order_value ?? 0),
                'trend' => round($trend, 2),
            ];
        });
    }

    public function getOrderMetrics(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $cacheKey = "dashboard:orders:{$shopIds->implode(',')}:{$start->format('Ymd')}:{$end->format('Ymd')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(5), function () use ($shopIds, $start, $end) {
            $unpaid = PaymentStatus::UNPAID->value;
            $paid = PaymentStatus::PAID->value;
            $cancelled = OrderStatus::CANCELLED->value;
            $delivered = OrderStatus::DELIVERED->value;
            $processing = OrderStatus::PROCESSING->value;
            $confirmed = OrderStatus::CONFIRMED->value;
            $pending = OrderStatus::PENDING->value;
            $orders = Order::query()->whereIn('shop_id', $shopIds)
                ->whereBetween('created_at', [$start, $end])
                ->selectRaw("
                    COUNT(*) as total_count,
                    SUM(CASE WHEN status = '$pending' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN status = '$confirmed' THEN 1 ELSE 0 END) as confirmed_count,
                    SUM(CASE WHEN status = '$processing' THEN 1 ELSE 0 END) as processing_count,
                    SUM(CASE WHEN status = '$delivered' THEN 1 ELSE 0 END) as delivered_count,
                    SUM(CASE WHEN status = '$cancelled' THEN 1 ELSE 0 END) as cancelled_count,
                    SUM(CASE WHEN payment_status = '$paid' THEN 1 ELSE 0 END) as paid_count,
                    SUM(CASE WHEN payment_status = '$unpaid' THEN 1 ELSE 0 END) as unpaid_count
                ")
                ->first();

            return [
                'total_count' => (int)($orders->total_count ?? 0),
                'pending_count' => (int)($orders->pending_count ?? 0),
                'confirmed_count' => (int)($orders->confirmed_count ?? 0),
                'processing_count' => (int)($orders->processing_count ?? 0),
                'delivered_count' => (int)($orders->delivered_count ?? 0),
                'cancelled_count' => (int)($orders->cancelled_count ?? 0),
                'paid_count' => (int)($orders->paid_count ?? 0),
                'unpaid_count' => (int)($orders->unpaid_count ?? 0),
            ];
        });
    }

    public function getTopProducts(Collection $shopIds, Carbon $start, Carbon $end, int $limit = 5): array
    {
        $cacheKey = "dashboard:top-products:{$shopIds->implode(',')}:{$start->format('Ymd')}:{$end->format('Ymd')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(15), function () use ($shopIds, $start, $end, $limit) {
            return OrderItem::query()->whereHas('order', function ($query) use ($shopIds, $start, $end) {
                $query->whereIn('shop_id', $shopIds)
                    ->whereBetween('created_at', [$start, $end])
                    ->whereNotIn('status', [OrderStatus::CANCELLED]);
            })
                ->selectRaw('
                    product_variant_id,
                    SUM(quantity) as total_quantity,
                    SUM(total_amount) as total_revenue,
                    COUNT(DISTINCT order_id) as order_count
                ')
                ->groupBy('product_variant_id')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->with(['productVariant.product'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->product_variant_id,
                        'name' => $item->productVariant?->product?->name ?? 'Unknown',
                        'variant_name' => $item->productVariant?->name ?? '',
                        'sku' => $item->productVariant?->sku ?? '',
                        'total_quantity' => (int)$item->total_quantity,
                        'total_revenue' => (float)$item->total_revenue,
                        'order_count' => (int)$item->order_count,
                    ];
                })
                ->toArray();
        });
    }

    public function getRecentOrders(Collection $shopIds, int $limit = 10): array
    {
        return Order::query()->whereIn('shop_id', $shopIds)
            ->with(['customer:id,first_name,last_name', 'shop:id,name'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer
                        ? "{$order->customer->first_name} {$order->customer->last_name}"
                        : 'Walk-in',
                    'shop_name' => $order->shop?->name ?? 'Unknown',
                    'total_amount' => (float)$order->total_amount,
                    'status' => $order->status->value,
                    'payment_status' => $order->payment_status->value,
                    'created_at' => $order->created_at->toIso8601String(),
                ];
            })
            ->toArray();
    }

    public function getLowStockAlerts(Collection $shopIds): array
    {
        $cacheKey = "dashboard:low-stock:{$shopIds->implode(',')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(10), function () use ($shopIds) {
            return ProductVariant::query()->whereHas('product', function ($query) use ($shopIds) {
                $query->whereIn('shop_id', $shopIds);
            })
                ->whereNotNull('reorder_level')
                ->with(['product:id,name,shop_id', 'inventoryLocations' => function ($query) use ($shopIds) {
                    $query->whereIn('location_id', $shopIds)
                        ->where('location_type', Shop::class);
                }])
                ->get()
                ->filter(function ($variant) {
                    return $variant->total_stock <= ($variant->reorder_level ?? 0);
                })
                ->map(function ($variant) {
                    return [
                        'id' => $variant->id,
                        'product_name' => $variant->product?->name ?? 'Unknown',
                        'variant_name' => $variant->name ?? '',
                        'sku' => $variant->sku,
                        'current_stock' => $variant->total_stock,
                        'reorder_level' => $variant->reorder_level,
                        'deficit' => $variant->reorder_level - $variant->total_stock,
                    ];
                })
                ->sortByDesc('deficit')
                ->values()
                ->toArray();
        });
    }

    public function getSalesChartData(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $days = [];
        $revenues = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $revenue = Order::query()->whereIn('shop_id', $shopIds)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->whereNotIn('status', [OrderStatus::CANCELLED])
                ->sum('total_amount');

            $days[] = $date->format('M d');
            $revenues[] = (float)$revenue;
        }

        return [
            'labels' => $days,
            'data' => $revenues,
        ];
    }

    public function getInventoryValuation(Collection $shopIds): float
    {
        $cacheKey = "dashboard:inventory-valuation:{$shopIds->implode(',')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(10), function () use ($shopIds) {
            $valuation = ProductVariant::query()->whereHas('product', function ($query) use ($shopIds) {
                $query->whereIn('shop_id', $shopIds);
            })
                ->whereNotNull('cost_price')
                ->with(['inventoryLocations' => function ($query) use ($shopIds) {
                    $query->whereIn('location_id', $shopIds)
                        ->where('location_type', Shop::class);
                }])
                ->get()
                ->sum(function ($variant) {
                    $totalStock = $variant->inventoryLocations->sum('quantity');
                    return $totalStock * ($variant->cost_price ?? 0);
                });

            return (float)$valuation;
        });
    }

    public function getProfitMetrics(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $cacheKey = "dashboard:profit:{$shopIds->implode(',')}:{$start->format('Ymd')}:{$end->format('Ymd')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(5), function () use ($shopIds, $start, $end) {
            $orderItems = OrderItem::query()->whereHas('order', function ($query) use ($shopIds, $start, $end) {
                $query->whereIn('shop_id', $shopIds)
                    ->whereBetween('created_at', [$start, $end])
                    ->whereNotIn('status', [OrderStatus::CANCELLED]);
            })
                ->with('productVariant:id,cost_price')
                ->get();

            $totalRevenue = $orderItems->sum('total_amount');
            $totalCost = $orderItems->sum(function ($item) {
                return $item->quantity * ($item->productVariant?->cost_price ?? 0);
            });

            $profit = $totalRevenue - $totalCost;
            $margin = $totalRevenue > 0 ? ($profit / $totalRevenue) * 100 : 0;

            return [
                'profit' => (float)$profit,
                'margin' => round($margin, 2),
                'revenue' => (float)$totalRevenue,
                'cogs' => (float)$totalCost,
            ];
        });
    }

    public function clearCache(Collection $shopIds): void
    {
        Cache::tags(['dashboard'])->flush();
    }
}
