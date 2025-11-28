<?php

namespace App\Services;

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
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Get detailed sales report with pagination and filters
     */
    public function getSalesReport(
        Collection $shopIds,
        ?Carbon    $startDate = null,
        ?Carbon    $endDate = null,
        ?int       $categoryId = null,
        ?int       $productId = null,
        ?int       $customerId = null,
        ?string    $status = null,
        ?string    $paymentStatus = null,
        string     $groupBy = 'order', // order, product, customer, shop, day
        int        $perPage = 25
    ): LengthAwarePaginator
    {
        $startDate = $startDate ?? now()->startOfMonth();
        $endDate = $endDate ?? now()->endOfMonth();

        if ($groupBy === 'order') {
            return $this->getSalesByOrder($shopIds, $startDate, $endDate, $categoryId, $productId, $customerId, $status, $paymentStatus, $perPage);
        } elseif ($groupBy === 'product') {
            return $this->getSalesByProduct($shopIds, $startDate, $endDate, $categoryId, $productId, $perPage);
        } elseif ($groupBy === 'customer') {
            return $this->getSalesByCustomer($shopIds, $startDate, $endDate, $customerId, $perPage);
        } elseif ($groupBy === 'shop') {
            return $this->getSalesByShop($shopIds, $startDate, $endDate, $perPage);
        } elseif ($groupBy === 'day') {
            return $this->getSalesByDay($shopIds, $startDate, $endDate, $perPage);
        }

        return $this->getSalesByOrder($shopIds, $startDate, $endDate, $categoryId, $productId, $customerId, $status, $paymentStatus, $perPage);
    }

    protected function getSalesByOrder(
        Collection $shopIds,
        Carbon     $startDate,
        Carbon     $endDate,
        ?int       $categoryId,
        ?int       $productId,
        ?int       $customerId,
        ?string    $status,
        ?string    $paymentStatus,
        int        $perPage
    ): LengthAwarePaginator
    {
        $query = Order::query()
            ->with(['customer:id,first_name,last_name,email', 'shop:id,name', 'items.productVariant.product'])
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($paymentStatus) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($categoryId || $productId) {
            $query->whereHas('items.productVariant.product', function ($q) use ($categoryId, $productId) {
                if ($categoryId) {
                    $q->where('category_id', $categoryId);
                }
                if ($productId) {
                    $q->where('id', $productId);
                }
            });
        }

        return $query->latest()->paginate($perPage);
    }

    protected function getSalesByProduct(
        Collection $shopIds,
        Carbon     $startDate,
        Carbon     $endDate,
        ?int       $categoryId,
        ?int       $productId,
        int        $perPage
    ): LengthAwarePaginator
    {
        $query = OrderItem::query()
            ->select('product_variant_id')
            ->selectRaw('COUNT(DISTINCT order_id) as order_count')
            ->selectRaw('SUM(quantity) as total_quantity')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('AVG(unit_price) as avg_price')
            ->with(['productVariant.product.category'])
            ->whereHas('order', function ($q) use ($shopIds, $startDate, $endDate) {
                $q->whereIn('shop_id', $shopIds)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->whereNotIn('status', [OrderStatus::CANCELLED]);
            });

        if ($categoryId || $productId) {
            $query->whereHas('productVariant.product', function ($q) use ($categoryId, $productId) {
                if ($categoryId) {
                    $q->where('category_id', $categoryId);
                }
                if ($productId) {
                    $q->where('id', $productId);
                }
            });
        }

        return $query->groupBy('product_variant_id')
            ->orderByDesc('total_revenue')
            ->paginate($perPage);
    }

    protected function getSalesByCustomer(
        Collection $shopIds,
        Carbon     $startDate,
        Carbon     $endDate,
        ?int       $customerId,
        int        $perPage
    ): LengthAwarePaginator
    {
        $query = Order::query()
            ->select('customer_id')
            ->selectRaw('COUNT(*) as order_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('AVG(total_amount) as avg_order_value')
            ->selectRaw('SUM(CASE WHEN payment_status = ? THEN 1 ELSE 0 END) as paid_orders', [PaymentStatus::PAID->value])
            ->selectRaw('MAX(created_at) as last_order_date')
            ->with('customer:id,first_name,last_name,email')
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', [OrderStatus::CANCELLED]);

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        return $query->groupBy('customer_id')
            ->orderByDesc('total_revenue')
            ->paginate($perPage);
    }

    protected function getSalesByShop(
        Collection $shopIds,
        Carbon     $startDate,
        Carbon     $endDate,
        int        $perPage
    ): LengthAwarePaginator
    {
        return Order::query()
            ->select('shop_id')
            ->selectRaw('COUNT(*) as order_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('SUM(discount_amount) as total_discounts')
            ->selectRaw('AVG(total_amount) as avg_order_value')
            ->with('shop:id,name')
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', [OrderStatus::CANCELLED])
            ->groupBy('shop_id')
            ->orderByDesc('total_revenue')
            ->paginate($perPage);
    }

    protected function getSalesByDay(
        Collection $shopIds,
        Carbon     $startDate,
        Carbon     $endDate,
        int        $perPage
    ): LengthAwarePaginator
    {
        return Order::query()
            ->selectRaw('DATE(created_at) as sale_date')
            ->selectRaw('COUNT(*) as order_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('AVG(total_amount) as avg_order_value')
            ->selectRaw('SUM(discount_amount) as total_discounts')
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', [OrderStatus::CANCELLED])
            ->groupBy('sale_date')
            ->orderByDesc('sale_date')
            ->paginate($perPage);
    }

    /**
     * Get inventory report with stock levels and valuations
     */
    public function getInventoryReport(
        Collection $shopIds,
        ?int       $categoryId = null,
        ?int       $productId = null,
        ?string    $stockStatus = null, // low, adequate, overstocked
        int        $perPage = 25
    ): LengthAwarePaginator
    {
        $query = ProductVariant::query()
            ->with(['product.category', 'product.shop', 'inventoryLocations' => function ($q) use ($shopIds) {
                $q->whereIn('location_id', $shopIds)
                    ->where('location_type', Shop::class);
            }])
            ->whereHas('product', function ($q) use ($shopIds, $categoryId, $productId) {
                $q->whereIn('shop_id', $shopIds);
                if ($categoryId) {
                    $q->where('category_id', $categoryId);
                }
                if ($productId) {
                    $q->where('id', $productId);
                }
            })
            ->where('is_active', true);

        if ($stockStatus === 'low') {
            $query->whereNotNull('reorder_level')
                ->whereRaw('(SELECT SUM(quantity) FROM inventory_locations WHERE product_variant_id = product_variants.id) <= reorder_level');
        } elseif ($stockStatus === 'adequate') {
            $query->whereNotNull('reorder_level')
                ->whereRaw('(SELECT SUM(quantity) FROM inventory_locations WHERE product_variant_id = product_variants.id) > reorder_level')
                ->whereRaw('(SELECT SUM(quantity) FROM inventory_locations WHERE product_variant_id = product_variants.id) <= (reorder_level * 3)');
        } elseif ($stockStatus === 'overstocked') {
            $query->whereNotNull('reorder_level')
                ->whereRaw('(SELECT SUM(quantity) FROM inventory_locations WHERE product_variant_id = product_variants.id) > (reorder_level * 3)');
        }

        return $query->orderBy('sku')->paginate($perPage);
    }

    /**
     * Get stock movement history report
     */
    public function getStockMovementReport(
        Collection $shopIds,
        ?Carbon    $startDate = null,
        ?Carbon    $endDate = null,
        ?int       $productId = null,
        ?string    $movementType = null,
        int        $perPage = 25
    ): LengthAwarePaginator
    {
        $startDate = $startDate ?? now()->startOfMonth();
        $endDate = $endDate ?? now()->endOfMonth();

        $query = StockMovement::query()
            ->with(['productVariant.product', 'shop', 'performedBy:id,first_name,last_name'])
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($productId) {
            $query->whereHas('productVariant.product', function ($q) use ($productId) {
                $q->where('id', $productId);
            });
        }

        if ($movementType) {
            $query->where('type', $movementType);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get supplier performance report
     */
    public function getSupplierReport(
        int        $tenantId,
        Collection $shopIds,
        ?Carbon    $startDate = null,
        ?Carbon    $endDate = null,
        ?int       $supplierId = null,
        ?string    $status = null,
        ?string    $paymentStatus = null,
        int        $perPage = 25
    ): LengthAwarePaginator
    {
        $startDate = $startDate ?? now()->startOfMonth();
        $endDate = $endDate ?? now()->endOfMonth();

        $query = PurchaseOrder::query()
            ->forBuyer($tenantId)
            ->with(['supplierTenant:id,name', 'shop:id,name'])
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($supplierId) {
            $query->where('supplier_tenant_id', $supplierId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($paymentStatus) {
            $query->where('payment_status', $paymentStatus);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get supplier performance summary
     */
    public function getSupplierPerformanceSummary(
        int        $tenantId,
        Collection $shopIds,
        Carbon     $startDate,
        Carbon     $endDate
    ): Collection
    {
        return PurchaseOrder::query()
            ->forBuyer($tenantId)
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', [PurchaseOrderStatus::CANCELLED])
            ->select('supplier_tenant_id')
            ->selectRaw('COUNT(*) as po_count')
            ->selectRaw('SUM(total_amount) as total_spend')
            ->selectRaw('AVG(total_amount) as avg_po_value')
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_count', [PurchaseOrderStatus::COMPLETED->value])
            ->selectRaw('SUM(CASE WHEN payment_status = ? THEN 1 ELSE 0 END) as paid_count', [PurchaseOrderPaymentStatus::PAID->value])
            ->selectRaw('AVG(DATEDIFF(COALESCE(expected_delivery_date, NOW()), created_at)) as avg_lead_time')
            ->groupBy('supplier_tenant_id')
            ->with('supplierTenant:id,name')
            ->orderByDesc('total_spend')
            ->get();
    }

    /**
     * Get financial report data
     */
    public function getFinancialReport(
        Collection $shopIds,
        Carbon     $startDate,
        Carbon     $endDate
    ): array
    {
        // Profit & Loss Statement
        $revenue = Order::whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', [OrderStatus::CANCELLED])
            ->selectRaw('
                SUM(subtotal) as gross_sales,
                SUM(discount_amount) as total_discounts,
                SUM(total_amount) as net_sales,
                SUM(tax_amount) as sales_tax,
                SUM(shipping_cost) as shipping_revenue
            ')
            ->first();

        // Cost of Goods Sold
        $cogs = OrderItem::whereHas('order', function ($q) use ($shopIds, $startDate, $endDate) {
            $q->whereIn('shop_id', $shopIds)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->whereNotIn('status', [OrderStatus::CANCELLED]);
        })
            ->with('productVariant:id,cost_price')
            ->get()
            ->sum(function ($item) {
                return $item->quantity * ($item->productVariant?->cost_price ?? 0);
            });

        // Operating Expenses
        $expenses = PurchaseOrder::whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', [PurchaseOrderStatus::CANCELLED])
            ->selectRaw('
                SUM(total_amount) as total_expenses,
                SUM(paid_amount) as paid_expenses,
                SUM(total_amount - paid_amount) as outstanding_expenses
            ')
            ->first();

        $grossProfit = ($revenue->net_sales ?? 0) - $cogs;
        $netProfit = $grossProfit - ($expenses->paid_expenses ?? 0);

        return [
            'profit_loss' => [
                'gross_sales' => (float)($revenue->gross_sales ?? 0),
                'discounts' => (float)($revenue->total_discounts ?? 0),
                'net_sales' => (float)($revenue->net_sales ?? 0),
                'cogs' => (float)$cogs,
                'gross_profit' => (float)$grossProfit,
                'gross_margin' => $revenue->net_sales > 0 ? round(($grossProfit / $revenue->net_sales) * 100, 2) : 0,
                'operating_expenses' => (float)($expenses->paid_expenses ?? 0),
                'net_profit' => (float)$netProfit,
                'net_margin' => $revenue->net_sales > 0 ? round(($netProfit / $revenue->net_sales) * 100, 2) : 0,
            ],
            'cash_flow' => $this->getCashFlowStatement($shopIds, $startDate, $endDate),
            'balance_sheet' => $this->getBalanceSheetData($shopIds),
        ];
    }

    protected function getCashFlowStatement(Collection $shopIds, Carbon $startDate, Carbon $endDate): array
    {
        $cashInflow = Order::whereIn('shop_id', $shopIds)
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->where('payment_status', PaymentStatus::PAID)
            ->sum('total_amount');

        $cashOutflow = PurchaseOrder::whereIn('shop_id', $shopIds)
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->sum('paid_amount');

        return [
            'cash_inflow' => (float)$cashInflow,
            'cash_outflow' => (float)$cashOutflow,
            'net_cash_flow' => (float)($cashInflow - $cashOutflow),
        ];
    }

    protected function getBalanceSheetData(Collection $shopIds): array
    {
        // Current Assets
        $inventory = ProductVariant::whereHas('product', function ($q) use ($shopIds) {
            $q->whereIn('shop_id', $shopIds);
        })
            ->whereNotNull('cost_price')
            ->with(['inventoryLocations' => function ($q) use ($shopIds) {
                $q->whereIn('location_id', $shopIds)
                    ->where('location_type', Shop::class);
            }])
            ->get()
            ->sum(function ($variant) {
                $totalStock = $variant->inventoryLocations->sum('quantity');

                return $totalStock * ($variant->cost_price ?? 0);
            });

        $accountsReceivable = Order::whereIn('shop_id', $shopIds)
            ->where('payment_status', PaymentStatus::UNPAID)
            ->whereNotIn('status', [OrderStatus::CANCELLED])
            ->sum('total_amount');

        // Current Liabilities
        $accountsPayable = PurchaseOrder::whereIn('shop_id', $shopIds)
            ->whereIn('payment_status', [PurchaseOrderPaymentStatus::PENDING, PurchaseOrderPaymentStatus::PARTIAL])
            ->whereNotIn('status', [PurchaseOrderStatus::CANCELLED])
            ->sum(DB::raw('total_amount - paid_amount'));

        $currentAssets = $inventory + $accountsReceivable;
        $currentLiabilities = $accountsPayable;

        return [
            'assets' => [
                'inventory' => (float)$inventory,
                'accounts_receivable' => (float)$accountsReceivable,
                'total_current_assets' => (float)$currentAssets,
            ],
            'liabilities' => [
                'accounts_payable' => (float)$accountsPayable,
                'total_current_liabilities' => (float)$currentLiabilities,
            ],
            'working_capital' => (float)($currentAssets - $currentLiabilities),
        ];
    }

    /**
     * Get sales summary statistics
     */
    public function getSalesSummary(Collection $shopIds, Carbon $startDate, Carbon $endDate): array
    {
        $summary = Order::whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', [OrderStatus::CANCELLED])
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value,
                SUM(discount_amount) as total_discounts,
                SUM(tax_amount) as total_tax,
                SUM(CASE WHEN payment_status = ? THEN 1 ELSE 0 END) as paid_orders
            ', [PaymentStatus::PAID->value])
            ->first();

        return [
            'total_orders' => (int)($summary->total_orders ?? 0),
            'total_revenue' => (float)($summary->total_revenue ?? 0),
            'avg_order_value' => (float)($summary->avg_order_value ?? 0),
            'total_discounts' => (float)($summary->total_discounts ?? 0),
            'total_tax' => (float)($summary->total_tax ?? 0),
            'paid_orders' => (int)($summary->paid_orders ?? 0),
            'payment_rate' => $summary->total_orders > 0
                ? round(($summary->paid_orders / $summary->total_orders) * 100, 2)
                : 0,
        ];
    }

    /**
     * Get inventory summary statistics
     */
    public function getInventorySummary(Collection $shopIds): array
    {
        $totalProducts = Product::whereIn('shop_id', $shopIds)
            ->where('is_active', true)
            ->count();

        $totalVariants = ProductVariant::whereHas('product', function ($q) use ($shopIds) {
            $q->whereIn('shop_id', $shopIds)->where('is_active', true);
        })->count();

        $totalValue = ProductVariant::whereHas('product', function ($q) use ($shopIds) {
            $q->whereIn('shop_id', $shopIds);
        })
            ->whereNotNull('cost_price')
            ->with(['inventoryLocations' => function ($q) use ($shopIds) {
                $q->whereIn('location_id', $shopIds)
                    ->where('location_type', Shop::class);
            }])
            ->get()
            ->sum(function ($variant) {
                $totalStock = $variant->inventoryLocations->sum('quantity');

                return $totalStock * ($variant->cost_price ?? 0);
            });

        $lowStockCount = ProductVariant::whereHas('product', function ($q) use ($shopIds) {
            $q->whereIn('shop_id', $shopIds);
        })
            ->whereNotNull('reorder_level')
            ->whereRaw('(SELECT SUM(quantity) FROM inventory_locations WHERE product_variant_id = product_variants.id) <= reorder_level')
            ->count();

        return [
            'total_products' => $totalProducts,
            'total_variants' => $totalVariants,
            'total_value' => (float)$totalValue,
            'low_stock_count' => $lowStockCount,
        ];
    }

    /**
     * Get Customer Analytics Report
     */
    public function getCustomerAnalytics(
        Collection $shopIds,
        ?Carbon    $startDate = null,
        ?Carbon    $endDate = null,
        ?int       $customerId = null,
        string     $segment = 'all', // all, high_value, at_risk, inactive
        int        $perPage = 25
    ): LengthAwarePaginator
    {
        $startDate = $startDate ?? now()->startOfMonth();
        $endDate = $endDate ?? now()->endOfMonth();

        $query = DB::table('orders')
            ->select([
                'customer_id',
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('MAX(created_at) as last_order_date'),
                DB::raw('MIN(created_at) as first_order_date'),
                DB::raw('DATEDIFF(NOW(), MAX(created_at)) as days_since_last_order'),
            ])
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('customer_id')
            ->groupBy('customer_id');

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        // Apply segmentation
        if ($segment === 'high_value') {
            $query->havingRaw('SUM(total_amount) > ?', [10000]); // Customers with >10k revenue
        } elseif ($segment === 'at_risk') {
            $query->havingRaw('DATEDIFF(NOW(), MAX(created_at)) BETWEEN 30 AND 90'); // No orders in 30-90 days
        } elseif ($segment === 'inactive') {
            $query->havingRaw('DATEDIFF(NOW(), MAX(created_at)) > 90'); // No orders in >90 days
        }

        $query->orderByDesc('total_revenue');

        return $query->paginate($perPage)
            ->through(function ($item) {
                $customer = User::find($item->customer_id);
                $item->customer = $customer;
                $item->customer_status = $this->getCustomerStatus($item->days_since_last_order);
                $item->lifetime_value = (float)$item->total_revenue;

                return $item;
            });
    }

    /**
     * Get Customer Analytics Summary
     */
    public function getCustomerAnalyticsSummary(Collection $shopIds, Carbon $startDate, Carbon $endDate): array
    {
        $stats = DB::table('orders')
            ->selectRaw('
                COUNT(DISTINCT customer_id) as total_customers,
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value
            ')
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('customer_id')
            ->first();

        $highValueCustomers = DB::table('orders')
            ->select('customer_id')
            ->selectRaw('SUM(total_amount) as total_spent')
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('SUM(total_amount) > ?', [10000])
            ->count();

        $atRiskCustomers = DB::table('orders')
            ->select('customer_id')
            ->selectRaw('MAX(created_at) as last_order_date')
            ->whereIn('shop_id', $shopIds)
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('DATEDIFF(NOW(), MAX(created_at)) BETWEEN 30 AND 90')
            ->count();

        $inactiveCustomers = DB::table('orders')
            ->select('customer_id')
            ->selectRaw('MAX(created_at) as last_order_date')
            ->whereIn('shop_id', $shopIds)
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('DATEDIFF(NOW(), MAX(created_at)) > 90')
            ->count();

        return [
            'total_customers' => $stats->total_customers ?? 0,
            'total_orders' => $stats->total_orders ?? 0,
            'total_revenue' => (float)($stats->total_revenue ?? 0),
            'avg_order_value' => (float)($stats->avg_order_value ?? 0),
            'high_value_customers' => $highValueCustomers,
            'at_risk_customers' => $atRiskCustomers,
            'inactive_customers' => $inactiveCustomers,
        ];
    }

    /**
     * Get Product Profitability Report
     */
    public function getProductProfitability(
        Collection $shopIds,
        ?Carbon    $startDate = null,
        ?Carbon    $endDate = null,
        ?int       $categoryId = null,
        ?int       $productId = null,
        string     $sortBy = 'profit', // profit, margin, revenue, quantity
        int        $perPage = 25
    ): LengthAwarePaginator
    {
        $startDate = $startDate ?? now()->startOfMonth();
        $endDate = $endDate ?? now()->endOfMonth();

        $query = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->select([
                'order_items.product_variant_id',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.total_amount) as total_revenue'),
                DB::raw('SUM(order_items.quantity * product_variants.cost_price) as total_cogs'),
                DB::raw('SUM(order_items.total_amount - (order_items.quantity * product_variants.cost_price)) as gross_profit'),
                DB::raw('AVG(order_items.unit_price) as avg_selling_price'),
                DB::raw('AVG(product_variants.cost_price) as cost_price'),
            ])
            ->whereIn('orders.shop_id', $shopIds)
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.status', '!=', OrderStatus::CANCELLED->value)
            ->groupBy('order_items.product_variant_id');

        if ($categoryId) {
            $query->where('products.category_id', $categoryId);
        }

        if ($productId) {
            $query->where('products.id', $productId);
        }

        // Apply sorting
        $query->orderByDesc(match ($sortBy) {
            'margin' => DB::raw('(SUM(order_items.total_amount - (order_items.quantity * product_variants.cost_price)) / NULLIF(SUM(order_items.total_amount), 0)) * 100'),
            'revenue' => 'total_revenue',
            'quantity' => 'total_quantity',
            default => 'gross_profit',
        });

        return $query->paginate($perPage)
            ->through(function ($item) {
                $variant = ProductVariant::with(['product.category'])->find($item->product_variant_id);
                $item->productVariant = $variant;
                $item->profit_margin = $item->total_revenue > 0
                    ? (($item->gross_profit / $item->total_revenue) * 100)
                    : 0;

                return $item;
            });
    }

    /**
     * Get Product Profitability Summary
     */
    public function getProductProfitabilitySummary(Collection $shopIds, Carbon $startDate, Carbon $endDate): array
    {
        $stats = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->selectRaw('
                SUM(order_items.quantity) as total_units_sold,
                SUM(order_items.total_amount) as total_revenue,
                SUM(order_items.quantity * product_variants.cost_price) as total_cogs,
                SUM(order_items.total_amount - (order_items.quantity * product_variants.cost_price)) as gross_profit
            ')
            ->whereIn('orders.shop_id', $shopIds)
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.status', '!=', OrderStatus::CANCELLED->value)
            ->first();

        $avgMargin = $stats->total_revenue > 0
            ? (($stats->gross_profit / $stats->total_revenue) * 100)
            : 0;

        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->select('order_items.product_variant_id')
            ->selectRaw('SUM(order_items.total_amount - (order_items.quantity * product_variants.cost_price)) as profit')
            ->whereIn('orders.shop_id', $shopIds)
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.status', '!=', OrderStatus::CANCELLED->value)
            ->groupBy('order_items.product_variant_id')
            ->orderByDesc('profit')
            ->limit(5)
            ->get();

        return [
            'total_units_sold' => $stats->total_units_sold ?? 0,
            'total_revenue' => (float)($stats->total_revenue ?? 0),
            'total_cogs' => (float)($stats->total_cogs ?? 0),
            'gross_profit' => (float)($stats->gross_profit ?? 0),
            'avg_margin' => (float)$avgMargin,
            'top_products' => $topProducts,
        ];
    }

    /**
     * Get customer status based on days since last order
     */
    protected function getCustomerStatus(int $daysSinceLastOrder): string
    {
        return match (true) {
            $daysSinceLastOrder <= 30 => 'Active',
            $daysSinceLastOrder <= 90 => 'At Risk',
            default => 'Inactive',
        };
    }
}
