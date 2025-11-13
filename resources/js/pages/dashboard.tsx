import AppLayout from '@/layouts/AppLayout';
import { DashboardProps } from '@/types/dashboard';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import Select from '@/components/form/Select';
import DatePicker from '@/components/form/date-picker';
import {
    AlertTriangle,
    DollarSign,
    Package,
    RefreshCw,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge.tsx';

export default function Dashboard({
    metrics,
    shops,
    selectedShop,
    period,
    startDate,
    endDate,
    can_view_financials,
}: DashboardProps) {
    const [showDatePickers, setShowDatePickers] = useState(period === 'custom');

    const handleFilterChange = (filters: Record<string, string>) => {
        router.get('/dashboard', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleShopChange = (value: string) => {
        const filters: Record<string, string> = { period };
        if (value) filters.shop = value;
        if (period === 'custom' && startDate && endDate) {
            filters.from = startDate;
            filters.to = endDate;
        }
        handleFilterChange(filters);
    };

    const handlePeriodChange = (value: string) => {
        setShowDatePickers(value === 'custom');
        if (value !== 'custom') {
            const filters: Record<string, string> = { period: value };
            if (selectedShop) filters.shop = selectedShop.toString();
            handleFilterChange(filters);
        }
    };

    const handleDateChange = () => {
        const fromInput = document.getElementById(
            'from-date',
        ) as HTMLInputElement;
        const toInput = document.getElementById('to-date') as HTMLInputElement;

        if (fromInput?.value && toInput?.value) {
            const filters: Record<string, string> = {
                period: 'custom',
                from: fromInput.value,
                to: toInput.value,
            };
            if (selectedShop) filters.shop = selectedShop.toString();
            handleFilterChange(filters);
        }
    };

    const handleRefresh = () => {
        router.post(
            '/dashboard/refresh',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    const shopOptions = [
        { value: '', label: 'All Shops' },
        ...shops.map((shop) => ({
            value: shop.id.toString(),
            label: shop.name,
        })),
    ];

    const periodOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'custom', label: 'Custom Range' },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Overview of your business metrics
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-40">
                            <Select
                                options={shopOptions}
                                defaultValue={
                                    selectedShop ? selectedShop.toString() : ''
                                }
                                onChange={handleShopChange}
                                placeholder="Select shop"
                            />
                        </div>

                        <div className="w-40">
                            <Select
                                options={periodOptions}
                                defaultValue={period}
                                onChange={handlePeriodChange}
                                placeholder="Period"
                            />
                        </div>

                        {showDatePickers && (
                            <>
                                <DatePicker
                                    id="from-date"
                                    mode="single"
                                    defaultDate={startDate || undefined}
                                    placeholder="From"
                                    onChange={handleDateChange}
                                />

                                <DatePicker
                                    id="to-date"
                                    mode="single"
                                    defaultDate={endDate || undefined}
                                    placeholder="To"
                                    onChange={handleDateChange}
                                />
                            </>
                        )}

                        <Button
                            variant="outline"
                            size="md"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

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
                                    {formatCurrency(
                                        metrics.sales.total_revenue,
                                    )}
                                </p>
                                {metrics.sales.trend !== 0 && (
                                    <p
                                        className={`flex items-center gap-1 text-sm ${metrics.sales.trend > 0 ? 'text-success-600' : 'text-error-600'}`}
                                    >
                                        {metrics.sales.trend > 0 ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3" />
                                        )}
                                        {Math.abs(metrics.sales.trend).toFixed(
                                            1,
                                        )}
                                        %
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
                                    {formatNumber(metrics.orders.total_count)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {metrics.orders.delivered_count} delivered
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
                                    {formatCurrency(
                                        metrics.sales.avg_order_value,
                                    )}
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
                                    {metrics.low_stock.length}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {metrics.orders.pending_count} pending
                                    orders
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {can_view_financials && metrics.profit && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card title="Profit Overview" className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        Total Profit
                                    </span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(metrics.profit.profit)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        Profit Margin
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {metrics.profit.margin.toFixed(2)}%
                                    </span>
                                </div>
                                {metrics.profit.cogs !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Cost of Goods
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                metrics.profit.cogs,
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {metrics.inventory_valuation !== undefined && (
                            <Card title="Inventory Valuation" className="p-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        Total Value
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(
                                            metrics.inventory_valuation,
                                        )}
                                    </span>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card title="Sales Trend (Last 7 Days)" className="p-6">
                        <div className="space-y-2">
                            {metrics.chart_data.labels.map((label, index) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {label}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(
                                            metrics.chart_data.data[index],
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Order Status" className="p-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="light" color="warning">
                                        Pending
                                    </Badge>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {metrics.orders.pending_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="light" color="info">
                                        Confirmed
                                    </Badge>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {metrics.orders.confirmed_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="light" color="primary">
                                        Processing
                                    </Badge>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {metrics.orders.processing_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="light" color="success">
                                        Delivered
                                    </Badge>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {metrics.orders.delivered_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="light" color="dark">
                                        Cancelled
                                    </Badge>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {metrics.orders.cancelled_count}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {metrics.top_products.length > 0 && (
                    <Card title="Top Selling Products" className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            SKU
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {metrics.top_products.map((product) => (
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
                                                {formatNumber(
                                                    product.total_quantity,
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    product.total_revenue,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {metrics.low_stock.length > 0 && (
                    <Card title="Low Stock Alerts" className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Badge variant="solid" color="error">
                                {metrics.low_stock.length}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Items below reorder level
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            SKU
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Current
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Reorder
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Deficit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {metrics.low_stock.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.product_name}
                                                </div>
                                                {item.variant_name && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {item.variant_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {item.sku}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-error-600">
                                                {formatNumber(
                                                    item.current_stock,
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                                                {formatNumber(
                                                    item.reorder_level,
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-error-600">
                                                -{formatNumber(item.deficit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {metrics.recent_orders.length > 0 && (
                    <Card title="Recent Orders" className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Order #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Shop
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {metrics.recent_orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {order.order_number}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {order.customer_name}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {order.shop_name}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    order.total_amount,
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge
                                                    variant="light"
                                                    color={
                                                        order.status ===
                                                        'delivered'
                                                            ? 'success'
                                                            : order.status ===
                                                                'pending'
                                                              ? 'warning'
                                                              : order.status ===
                                                                  'cancelled'
                                                                ? 'error'
                                                                : 'info'
                                                    }
                                                >
                                                    {order.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
