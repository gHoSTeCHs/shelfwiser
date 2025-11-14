<?php

namespace App\Services;

use App\Enums\ConnectionStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\SupplierConnection;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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

    // SUPPLIER TAB METHODS
    public function getSupplierData(User $user, Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $tenantId = $user->tenant_id;
        $cacheKey = "dashboard:suppliers:{$tenantId}:{$start->format('Ymd')}:{$end->format('Ymd')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(10), function () use ($tenantId, $shopIds, $start, $end) {
            return [
                'summary' => $this->getSupplierSummary($tenantId, $start, $end),
                'top_suppliers' => $this->getTopSuppliers($tenantId, $start, $end, 5),
                'recent_pos' => $this->getRecentPurchaseOrders($tenantId, $shopIds, 5),
                'payment_status_breakdown' => $this->getPaymentStatusBreakdown($tenantId, $start, $end),
                'po_status_breakdown' => $this->getPOStatusBreakdown($tenantId, $start, $end),
            ];
        });
    }

    protected function getSupplierSummary(int $tenantId, Carbon $start, Carbon $end): array
    {
        $totalSuppliers = SupplierConnection::forBuyer($tenantId)
            ->approved()
            ->count();

        $activePOs = PurchaseOrder::forBuyer($tenantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('status', [PurchaseOrderStatus::COMPLETED, PurchaseOrderStatus::CANCELLED])
            ->count();

        $pendingPayments = PurchaseOrder::forBuyer($tenantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereIn('payment_status', [PurchaseOrderPaymentStatus::PENDING, PurchaseOrderPaymentStatus::PARTIAL])
            ->sum(DB::raw('total_amount - paid_amount'));

        $overduePayments = PurchaseOrder::forBuyer($tenantId)
            ->where('payment_status', PurchaseOrderPaymentStatus::OVERDUE)
            ->sum(DB::raw('total_amount - paid_amount'));

        $totalSpend = PurchaseOrder::forBuyer($tenantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('status', [PurchaseOrderStatus::CANCELLED])
            ->sum('total_amount');

        return [
            'total_suppliers' => $totalSuppliers,
            'active_pos' => $activePOs,
            'pending_payments' => (float) $pendingPayments,
            'overdue_payments' => (float) $overduePayments,
            'total_spend' => (float) $totalSpend,
        ];
    }

    protected function getTopSuppliers(int $tenantId, Carbon $start, Carbon $end, int $limit): array
    {
        return PurchaseOrder::forBuyer($tenantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('status', [PurchaseOrderStatus::CANCELLED])
            ->select('supplier_tenant_id')
            ->selectRaw('COUNT(*) as po_count')
            ->selectRaw('SUM(total_amount) as total_spend')
            ->selectRaw('AVG(total_amount) as avg_order_value')
            ->groupBy('supplier_tenant_id')
            ->orderByDesc('total_spend')
            ->limit($limit)
            ->with('supplierTenant:id,name')
            ->get()
            ->map(function ($item) {
                return [
                    'supplier_id' => $item->supplier_tenant_id,
                    'supplier_name' => $item->supplierTenant?->name ?? 'Unknown',
                    'po_count' => (int) $item->po_count,
                    'total_spend' => (float) $item->total_spend,
                    'avg_order_value' => (float) $item->avg_order_value,
                ];
            })
            ->toArray();
    }

    protected function getRecentPurchaseOrders(int $tenantId, Collection $shopIds, int $limit): array
    {
        return PurchaseOrder::forBuyer($tenantId)
            ->whereIn('shop_id', $shopIds)
            ->with(['supplierTenant:id,name', 'shop:id,name'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($po) {
                return [
                    'id' => $po->id,
                    'po_number' => $po->po_number,
                    'supplier_name' => $po->supplierTenant?->name ?? 'Unknown',
                    'shop_name' => $po->shop?->name ?? 'Unknown',
                    'total_amount' => (float) $po->total_amount,
                    'status' => $po->status->value,
                    'payment_status' => $po->payment_status->value,
                    'created_at' => $po->created_at->toIso8601String(),
                ];
            })
            ->toArray();
    }

    protected function getPaymentStatusBreakdown(int $tenantId, Carbon $start, Carbon $end): array
    {
        $breakdown = PurchaseOrder::forBuyer($tenantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('status', [PurchaseOrderStatus::CANCELLED])
            ->select('payment_status')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(total_amount) as total')
            ->groupBy('payment_status')
            ->get();

        return $breakdown->mapWithKeys(function ($item) {
            return [
                $item->payment_status->value => [
                    'count' => (int) $item->count,
                    'total' => (float) $item->total,
                    'label' => $item->payment_status->label(),
                    'color' => $item->payment_status->color(),
                ],
            ];
        })->toArray();
    }

    protected function getPOStatusBreakdown(int $tenantId, Carbon $start, Carbon $end): array
    {
        $breakdown = PurchaseOrder::forBuyer($tenantId)
            ->whereBetween('created_at', [$start, $end])
            ->select('status')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(total_amount) as total')
            ->groupBy('status')
            ->get();

        return $breakdown->mapWithKeys(function ($item) {
            return [
                $item->status->value => [
                    'count' => (int) $item->count,
                    'total' => (float) $item->total,
                    'label' => $item->status->label(),
                    'color' => $item->status->color(),
                ],
            ];
        })->toArray();
    }

    // SALES TAB METHODS
    public function getSalesData(User $user, Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $tenantId = $user->tenant_id;
        $cacheKey = "dashboard:sales-tab:{$shopIds->implode(',')}:{$start->format('Ymd')}:{$end->format('Ymd')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(10), function () use ($shopIds, $start, $end) {
            return [
                'summary' => $this->getSalesTabSummary($shopIds, $start, $end),
                'revenue_by_shop' => $this->getRevenueByShop($shopIds, $start, $end),
                'revenue_trend' => $this->getRevenueTrend($shopIds, $start, $end),
                'top_products' => $this->getTopProducts($shopIds, $start, $end, 10),
                'orders_by_status' => $this->getOrdersByStatus($shopIds, $start, $end),
            ];
        });
    }

    protected function getSalesTabSummary(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $metrics = Order::whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('status', [OrderStatus::CANCELLED])
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value,
                SUM(discount_amount) as total_discounts
            ')
            ->first();

        return [
            'total_orders' => (int) ($metrics->total_orders ?? 0),
            'total_revenue' => (float) ($metrics->total_revenue ?? 0),
            'avg_order_value' => (float) ($metrics->avg_order_value ?? 0),
            'total_discounts' => (float) ($metrics->total_discounts ?? 0),
        ];
    }

    protected function getRevenueByShop(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        return Order::whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('status', [OrderStatus::CANCELLED])
            ->select('shop_id')
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('COUNT(*) as order_count')
            ->groupBy('shop_id')
            ->with('shop:id,name')
            ->get()
            ->map(function ($item) {
                return [
                    'shop_id' => $item->shop_id,
                    'shop_name' => $item->shop?->name ?? 'Unknown',
                    'revenue' => (float) $item->revenue,
                    'order_count' => (int) $item->order_count,
                ];
            })
            ->toArray();
    }

    protected function getRevenueTrend(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $days = $start->diffInDays($end) + 1;
        $labels = [];
        $data = [];

        for ($i = 0; $i < min($days, 30); $i++) {
            $date = $start->copy()->addDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $revenue = Order::whereIn('shop_id', $shopIds)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->whereNotIn('status', [OrderStatus::CANCELLED])
                ->sum('total_amount');

            $labels[] = $date->format('M d');
            $data[] = (float) $revenue;
        }

        return [
            'labels' => $labels,
            'data' => $data,
        ];
    }

    protected function getOrdersByStatus(Collection $shopIds, Carbon $start, Carbon $end): array
    {
        $breakdown = Order::whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$start, $end])
            ->select('status')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(total_amount) as total')
            ->groupBy('status')
            ->get();

        return $breakdown->mapWithKeys(function ($item) {
            return [
                $item->status->value => [
                    'count' => (int) $item->count,
                    'total' => (float) $item->total,
                    'label' => $item->status->label(),
                    'color' => $item->status->color(),
                ],
            ];
        })->toArray();
    }

    // INVENTORY TAB METHODS
    public function getInventoryData(User $user, Collection $shopIds): array
    {
        $tenantId = $user->tenant_id;
        $cacheKey = "dashboard:inventory:{$shopIds->implode(',')}";

        return Cache::tags(['dashboard'])->remember($cacheKey, now()->addMinutes(10), function () use ($shopIds) {
            return [
                'summary' => $this->getInventorySummary($shopIds),
                'low_stock' => $this->getLowStockAlerts($shopIds),
                'stock_movements' => $this->getRecentStockMovements($shopIds, 10),
                'valuation_by_shop' => $this->getInventoryValuationByShop($shopIds),
            ];
        });
    }

    protected function getInventorySummary(Collection $shopIds): array
    {
        $totalProducts = Product::whereIn('shop_id', $shopIds)
            ->where('is_active', true)
            ->count();

        $totalVariants = ProductVariant::whereHas('product', function ($query) use ($shopIds) {
            $query->whereIn('shop_id', $shopIds);
        })
            ->where('is_active', true)
            ->count();

        $totalValue = ProductVariant::whereHas('product', function ($query) use ($shopIds) {
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

        $lowStockCount = ProductVariant::whereHas('product', function ($query) use ($shopIds) {
            $query->whereIn('shop_id', $shopIds);
        })
            ->whereNotNull('reorder_level')
            ->with(['inventoryLocations' => function ($query) use ($shopIds) {
                $query->whereIn('location_id', $shopIds)
                    ->where('location_type', Shop::class);
            }])
            ->get()
            ->filter(function ($variant) {
                return $variant->total_stock <= ($variant->reorder_level ?? 0);
            })
            ->count();

        return [
            'total_products' => $totalProducts,
            'total_variants' => $totalVariants,
            'total_value' => (float) $totalValue,
            'low_stock_count' => $lowStockCount,
        ];
    }

    protected function getRecentStockMovements(Collection $shopIds, int $limit): array
    {
        return StockMovement::whereIn('shop_id', $shopIds)
            ->with(['productVariant.product:id,name', 'shop:id,name', 'performedBy:id,first_name,last_name'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($movement) {
                return [
                    'id' => $movement->id,
                    'reference_number' => $movement->reference_number,
                    'product_name' => $movement->productVariant?->product?->name ?? 'Unknown',
                    'variant_name' => $movement->productVariant?->name ?? '',
                    'type' => $movement->type->value,
                    'quantity' => $movement->quantity,
                    'shop_name' => $movement->shop?->name ?? 'Unknown',
                    'performed_by' => $movement->performedBy
                        ? "{$movement->performedBy->first_name} {$movement->performedBy->last_name}"
                        : 'System',
                    'created_at' => $movement->created_at->toIso8601String(),
                ];
            })
            ->toArray();
    }

    protected function getInventoryValuationByShop(Collection $shopIds): array
    {
        return $shopIds->map(function ($shopId) {
            $shop = Shop::find($shopId);

            $valuation = ProductVariant::whereHas('product', function ($query) use ($shopId) {
                $query->where('shop_id', $shopId);
            })
                ->whereNotNull('cost_price')
                ->with(['inventoryLocations' => function ($query) use ($shopId) {
                    $query->where('location_id', $shopId)
                        ->where('location_type', Shop::class);
                }])
                ->get()
                ->sum(function ($variant) {
                    $totalStock = $variant->inventoryLocations->sum('quantity');
                    return $totalStock * ($variant->cost_price ?? 0);
                });

            return [
                'shop_id' => $shopId,
                'shop_name' => $shop?->name ?? 'Unknown',
                'valuation' => (float) $valuation,
            ];
        })->toArray();
    }
}
