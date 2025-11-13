import AppLayout from '@/layouts/AppLayout';
import { DashboardProps } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import React from 'react';
import DashboardFilters from '@/components/dashboard/DashboardFilters';

export default function Dashboard({
    metrics,
    shops,
    selectedShop,
    period,
    startDate,
    endDate,
    permissions,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Dashboard
                    </h1>
                </div>

                {/* Dashboard Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <DashboardFilters
                        shops={shops}
                        selectedShop={selectedShop}
                        period={period}
                        startDate={startDate}
                        endDate={endDate}
                    />
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Revenue */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    Total Revenue
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">
                                    ${metrics.sales.total_revenue.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                                {metrics.sales.trend !== 0 && (
                                    <p
                                        className={`text-sm mt-1 ${
                                            metrics.sales.trend > 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {metrics.sales.trend > 0 ? '+' : ''}
                                        {metrics.sales.trend.toFixed(1)}% from previous period
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    Total Orders
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">
                                    {metrics.orders.total_count.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {metrics.orders.delivered_count} delivered
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Average Order Value */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    Avg Order Value
                                </p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">
                                    ${metrics.sales.avg_order_value.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profit or Pending Orders (based on permissions) */}
                    {permissions.canViewProfits && metrics.profit ? (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Profit
                                    </p>
                                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                                        ${metrics.profit.profit.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {metrics.profit.margin.toFixed(1)}% margin
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Pending Orders
                                    </p>
                                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                                        {metrics.orders.pending_count.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Charts and Tables Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Sales Trend (Last 7 Days)
                        </h2>
                        <div className="space-y-2">
                            {metrics.chart_data.labels.map((label, index) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{label}</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        ${metrics.chart_data.data[index].toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Status Breakdown */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Order Status
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Pending</span>
                                <span className="text-sm font-medium text-yellow-600">
                                    {metrics.orders.pending_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Confirmed</span>
                                <span className="text-sm font-medium text-blue-600">
                                    {metrics.orders.confirmed_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Processing</span>
                                <span className="text-sm font-medium text-indigo-600">
                                    {metrics.orders.processing_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Delivered</span>
                                <span className="text-sm font-medium text-green-600">
                                    {metrics.orders.delivered_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Cancelled</span>
                                <span className="text-sm font-medium text-red-600">
                                    {metrics.orders.cancelled_count}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                {metrics.top_products.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Top Selling Products
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity Sold
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Revenue
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Orders
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {metrics.top_products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </div>
                                                {product.variant_name && (
                                                    <div className="text-sm text-gray-500">
                                                        {product.variant_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {product.sku}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {product.total_quantity.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                ${product.total_revenue.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {product.order_count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Low Stock Alerts */}
                {metrics.low_stock.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Low Stock Alerts
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {metrics.low_stock.length}
                            </span>
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Current Stock
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reorder Level
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Deficit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {metrics.low_stock.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.product_name}
                                                </div>
                                                {item.variant_name && (
                                                    <div className="text-sm text-gray-500">
                                                        {item.variant_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {item.sku}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">
                                                {item.current_stock.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {item.reorder_level.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">
                                                -{item.deficit.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Recent Orders */}
                {metrics.recent_orders.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Recent Orders
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shop
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {metrics.recent_orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {order.order_number}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {order.customer_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {order.shop_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                ${order.total_amount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        order.status === 'delivered'
                                                            ? 'bg-green-100 text-green-800'
                                                            : order.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : order.status === 'cancelled'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        order.payment_status === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : order.payment_status === 'unpaid'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Inventory Valuation - Only for authorized users */}
                {permissions.canViewFinancials && metrics.inventory_valuation !== undefined && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Inventory Valuation
                        </h2>
                        <p className="text-3xl font-bold text-gray-900">
                            ${metrics.inventory_valuation.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Total value of inventory at cost price
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
