import {
    AlertTriangle,
    DollarSign,
    Package,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import { DashboardMetrics } from '@/types/dashboard';
import ReusableLineChart from '@/components/charts/ReusableLineChart';
import ReusablePieChart from '@/components/charts/ReusablePieChart';
import ReusableBarChart from '@/components/charts/ReusableBarChart';

interface OverviewTabProps {
    data: DashboardMetrics;
    canViewFinancials: boolean;
}

export default function OverviewTab({
    data,
    canViewFinancials,
}: OverviewTabProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);

    const formatNumber = (value: number) =>
        new Intl.NumberFormat('en-NG').format(value);

    // Prepare chart data for order status
    const orderStatusData = [
        data.orders.pending_count,
        data.orders.confirmed_count,
        data.orders.processing_count,
        data.orders.delivered_count,
    ];

    const orderStatusLabels = ['Pending', 'Confirmed', 'Processing', 'Delivered'];
    const orderStatusColors = ['#fbbf24', '#60a5fa', '#a78bfa', '#34d399'];

    // Prepare payment status data
    const paymentStatusData = [
        data.orders.paid_count,
        data.orders.unpaid_count,
    ];

    const paymentStatusLabels = ['Paid', 'Unpaid'];
    const paymentStatusColors = ['#34d399', '#f87171'];

    // Prepare top products chart data
    const topProductsData = data.top_products.map(p => p.total_revenue);
    const topProductsLabels = data.top_products.map(p =>
        p.variant_name ? `${p.name} (${p.variant_name})` : p.name
    );

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                            <DollarSign className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.sales.total_revenue)}
                            </p>
                            {data.sales.trend !== 0 && (
                                <p
                                    className={`flex items-center gap-1 text-sm ${data.sales.trend > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}
                                >
                                    {data.sales.trend > 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3" />
                                    )}
                                    {Math.abs(data.sales.trend).toFixed(1)}%
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-light-100 p-3 dark:bg-blue-light-900/20">
                            <ShoppingCart className="h-6 w-6 text-blue-light-600 dark:text-blue-light-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total Orders
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatNumber(data.orders.total_count)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {data.orders.delivered_count} delivered
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                            <Package className="h-6 w-6 text-success-600 dark:text-success-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Avg Order Value
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.sales.avg_order_value)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {data.orders.paid_count} paid
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                            <AlertTriangle className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Low Stock Items
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.low_stock.length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {data.orders.pending_count} pending
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Profit and Valuation Cards */}
            {canViewFinancials && data.profit && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Gross Profit
                            </h3>
                            <div className="rounded-lg bg-success-100 p-2 dark:bg-success-900/20">
                                <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(data.profit.profit)}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Margin: <span className="font-semibold">{data.profit.margin.toFixed(2)}%</span>
                        </p>
                    </Card>

                    {data.profit.cogs !== undefined && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Cost of Goods Sold
                                </h3>
                                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/20">
                                    <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.profit.cogs)}
                            </p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                Total product costs
                            </p>
                        </Card>
                    )}

                    {data.inventory_valuation !== undefined && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Inventory Valuation
                                </h3>
                                <div className="rounded-lg bg-blue-light-100 p-2 dark:bg-blue-light-900/20">
                                    <Package className="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.inventory_valuation)}
                            </p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                Total stock value
                            </p>
                        </Card>
                    )}
                </div>
            )}

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Sales Trend Chart */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Sales Trend
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Revenue over the last 7 days
                        </p>
                    </div>
                    <ReusableLineChart
                        data={data.chart_data.data}
                        labels={data.chart_data.labels}
                        color="#465fff"
                        height={280}
                        title="Revenue"
                    />
                </Card>

                {/* Order Status Distribution */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Order Status Distribution
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Breakdown by order status
                        </p>
                    </div>
                    {data.orders.total_count > 0 ? (
                        <ReusablePieChart
                            data={orderStatusData}
                            labels={orderStatusLabels}
                            colors={orderStatusColors}
                            height={280}
                            type="donut"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500">
                            <div className="text-center">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-sm">No orders yet</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Payment Status and Top Products */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Payment Status */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Payment Status
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Payment collection status
                        </p>
                    </div>
                    {data.orders.total_count > 0 ? (
                        <div className="space-y-4">
                            <ReusablePieChart
                                data={paymentStatusData}
                                labels={paymentStatusLabels}
                                colors={paymentStatusColors}
                                height={220}
                                type="donut"
                            />
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
                                    <p className="text-lg font-bold text-success-600 dark:text-success-400">
                                        {data.orders.paid_count}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                                    <p className="text-lg font-bold text-error-600 dark:text-error-400">
                                        {data.orders.unpaid_count}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500">
                            <div className="text-center">
                                <DollarSign className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-sm">No payment data yet</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Top Products Chart */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Top Selling Products
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            By revenue
                        </p>
                    </div>
                    {data.top_products.length > 0 ? (
                        <ReusableBarChart
                            data={topProductsData}
                            labels={topProductsLabels}
                            color="#34d399"
                            height={280}
                            horizontal={true}
                            title="Revenue"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500">
                            <div className="text-center">
                                <Package className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-sm">No product data yet</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Low Stock Alerts and Recent Orders */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Low Stock Alerts */}
                {data.low_stock.length > 0 && (
                    <Card className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Low Stock Alerts
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Products running low
                                </p>
                            </div>
                            <Badge color="warning" size="sm">
                                {data.low_stock.length}
                            </Badge>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {data.low_stock.slice(0, 5).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {item.product_name}
                                        </p>
                                        {item.variant_name && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.variant_name}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            SKU: {item.sku}
                                        </p>
                                    </div>
                                    <div className="ml-4 text-right">
                                        <p className="text-sm font-bold text-error-600 dark:text-error-400">
                                            {item.current_stock}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Min: {item.reorder_level}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {data.low_stock.length > 5 && (
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                And {data.low_stock.length - 5} more items
                            </p>
                        )}
                    </Card>
                )}

                {/* Recent Orders */}
                {data.recent_orders.length > 0 && (
                    <Card className="p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Recent Orders
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Latest transactions
                            </p>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {data.recent_orders.slice(0, 5).map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            #{order.order_number}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {order.customer_name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                color={
                                                    order.status === 'delivered' ? 'success' :
                                                    order.status === 'pending' ? 'warning' :
                                                    order.status === 'cancelled' ? 'error' : 'info'
                                                }
                                                size="sm"
                                            >
                                                {order.status}
                                            </Badge>
                                            <Badge
                                                color={order.payment_status === 'paid' ? 'success' : 'error'}
                                                size="sm"
                                            >
                                                {order.payment_status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(order.total_amount)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(order.created_at).toLocaleDateString('en-NG', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Revenue Breakdown */}
            {data.sales.subtotal > 0 && (
                <Card className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Revenue Breakdown
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Detailed revenue components
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subtotal</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.sales.subtotal)}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tax</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.sales.tax_amount)}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shipping</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.sales.shipping_cost)}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Discounts</p>
                            <p className="text-lg font-bold text-error-600 dark:text-error-400">
                                -{formatCurrency(data.sales.discount_amount)}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                                {formatCurrency(data.sales.total_revenue)}
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
