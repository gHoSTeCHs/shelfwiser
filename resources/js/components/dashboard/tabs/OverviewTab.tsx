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

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                            <DollarSign className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.sales.total_revenue)}
                            </p>
                            {data.sales.trend !== 0 && (
                                <p
                                    className={`flex items-center gap-1 text-sm ${data.sales.trend > 0 ? 'text-success-600' : 'text-error-600'}`}
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
                        <div>
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
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Avg Order Value
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.sales.avg_order_value)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                            <AlertTriangle className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Low Stock Items
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.low_stock.length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {data.orders.pending_count} pending orders
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Profit and Valuation */}
            {canViewFinancials && data.profit && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card title="Profit Overview" className="p-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Total Profit
                                </span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(data.profit.profit)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Profit Margin
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {data.profit.margin.toFixed(2)}%
                                </span>
                            </div>
                            {data.profit.cogs !== undefined && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        Cost of Goods
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(data.profit.cogs)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {data.inventory_valuation !== undefined && (
                        <Card title="Inventory Valuation" className="p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Total Value
                                </span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(data.inventory_valuation)}
                                </span>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Charts and Status */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Sales Trend (Last 7 Days)" className="p-6">
                    <div className="space-y-2">
                        {data.chart_data.labels.map((label, index) => (
                            <div
                                key={label}
                                className="flex items-center justify-between"
                            >
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {label}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(data.chart_data.data[index])}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Order Status" className="p-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Badge variant="light" color="warning">
                                Pending
                            </Badge>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {data.orders.pending_count}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Badge variant="light" color="info">
                                Confirmed
                            </Badge>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {data.orders.confirmed_count}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Badge variant="light" color="primary">
                                Processing
                            </Badge>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {data.orders.processing_count}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Badge variant="light" color="success">
                                Delivered
                            </Badge>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {data.orders.delivered_count}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Top Products */}
            {data.top_products.length > 0 && (
                <Card title="Top Selling Products" className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        SKU
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Quantity
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {data.top_products.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {product.name}
                                            </div>
                                            {product.variant_name && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {product.variant_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {product.sku}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                            {formatNumber(product.total_quantity)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(product.total_revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
