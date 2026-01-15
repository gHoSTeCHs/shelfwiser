import MetricCard from '@/components/dashboard/MetricCard';
import DataTable from '@/components/reports/DataTable';
import FilterBar from '@/components/reports/FilterBar';
import AppLayout from '@/layouts/AppLayout';
import { SalesReportProps } from '@/types/reports';
import { Head } from '@inertiajs/react';
import {
    DollarSign,
    PercentIcon,
    Receipt,
    ShoppingCart,
    Tag,
    TrendingUp,
} from 'lucide-react';

export default function SalesReport({
    summary,
    salesData,
    shops,
    categories,
    filters,
    orderStatuses,
    paymentStatuses,
    canViewCosts,
    canViewProfits,
}: SalesReportProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    // Filter configuration
    const filterConfig = [
        {
            name: 'from',
            label: 'From Date',
            type: 'date' as const,
            value: filters.from,
        },
        {
            name: 'to',
            label: 'To Date',
            type: 'date' as const,
            value: filters.to,
        },
        {
            name: 'shop',
            label: 'Shop',
            type: 'select' as const,
            options: shops.map((shop) => ({
                label: shop.name,
                value: shop.id,
            })),
            value: filters.shop,
        },
        {
            name: 'category',
            label: 'Category',
            type: 'select' as const,
            options: categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
            })),
            value: filters.category,
        },
        {
            name: 'status',
            label: 'Order Status',
            type: 'select' as const,
            options: Object.entries(orderStatuses).map(([value, label]) => ({
                label,
                value,
            })),
            value: filters.status,
        },
        {
            name: 'payment_status',
            label: 'Payment Status',
            type: 'select' as const,
            options: Object.entries(paymentStatuses).map(([value, label]) => ({
                label,
                value,
            })),
            value: filters.payment_status,
        },
        {
            name: 'group_by',
            label: 'Group By',
            type: 'select' as const,
            options: [
                { label: 'Order', value: 'order' },
                { label: 'Product', value: 'product' },
                { label: 'Customer', value: 'customer' },
                { label: 'Shop', value: 'shop' },
                { label: 'Day', value: 'day' },
            ],
            value: filters.group_by,
        },
    ];

    // Column configuration based on grouping
    const getColumns = () => {
        switch (filters.group_by) {
            case 'product':
                return [
                    {
                        key: 'product_variant',
                        label: 'Product',
                        render: (_: any, row: any) => (
                            <div>
                                <div className="font-medium">
                                    {row.product_variant?.product?.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {row.product_variant?.sku}
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: 'order_count',
                        label: 'Orders',
                        className: 'text-right',
                        render: (value: number) => value.toLocaleString(),
                    },
                    {
                        key: 'total_quantity',
                        label: 'Quantity Sold',
                        className: 'text-right',
                        render: (value: number) => value.toLocaleString(),
                    },
                    {
                        key: 'total_revenue',
                        label: 'Revenue',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'avg_price',
                        label: 'Avg Price',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                ];

            case 'customer':
                return [
                    {
                        key: 'customer',
                        label: 'Customer',
                        render: (_: any, row: any) => (
                            <div>
                                <div className="font-medium">
                                    {row.customer?.first_name}{' '}
                                    {row.customer?.last_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {row.customer?.email}
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: 'order_count',
                        label: 'Total Orders',
                        className: 'text-right',
                        render: (value: number) => value.toLocaleString(),
                    },
                    {
                        key: 'total_revenue',
                        label: 'Total Revenue',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'avg_order_value',
                        label: 'Avg Order Value',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'last_order_date',
                        label: 'Last Order',
                        render: (value: string) => formatDate(value),
                    },
                ];

            case 'shop':
                return [
                    {
                        key: 'shop',
                        label: 'Shop',
                        render: (_: any, row: any) => row.shop?.name || '-',
                    },
                    {
                        key: 'order_count',
                        label: 'Orders',
                        className: 'text-right',
                        render: (value: number) => value.toLocaleString(),
                    },
                    {
                        key: 'total_revenue',
                        label: 'Revenue',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'total_discounts',
                        label: 'Discounts',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'avg_order_value',
                        label: 'Avg Order Value',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                ];

            case 'day':
                return [
                    {
                        key: 'sale_date',
                        label: 'Date',
                        render: (value: string) => formatDate(value),
                    },
                    {
                        key: 'order_count',
                        label: 'Orders',
                        className: 'text-right',
                        render: (value: number) => value.toLocaleString(),
                    },
                    {
                        key: 'total_revenue',
                        label: 'Revenue',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'avg_order_value',
                        label: 'Avg Order',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'total_discounts',
                        label: 'Discounts',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                ];

            default: // order
                return [
                    {
                        key: 'order_number',
                        label: 'Order #',
                    },
                    {
                        key: 'customer',
                        label: 'Customer',
                        render: (_: any, row: any) =>
                            row.customer
                                ? `${row.customer.first_name} ${row.customer.last_name}`
                                : 'Walk-in',
                    },
                    {
                        key: 'shop',
                        label: 'Shop',
                        render: (_: any, row: any) => row.shop?.name || '-',
                    },
                    {
                        key: 'total_amount',
                        label: 'Amount',
                        className: 'text-right',
                        render: (value: number) => formatCurrency(value),
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        render: (value: string) => (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 capitalize dark:bg-gray-800 dark:text-gray-200">
                                {value.replace('_', ' ')}
                            </span>
                        ),
                    },
                    {
                        key: 'payment_status',
                        label: 'Payment',
                        render: (value: string) => (
                            <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
                                    value === 'paid'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                            >
                                {value}
                            </span>
                        ),
                    },
                    {
                        key: 'created_at',
                        label: 'Date',
                        render: (value: string) => formatDate(value),
                    },
                ];
        }
    };

    return (
        <>
            <Head title="Sales Report" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Sales Report
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Analyze sales performance across different dimensions
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <MetricCard
                        title="Total Orders"
                        value={summary.total_orders.toLocaleString()}
                        icon={ShoppingCart}
                        iconColor="text-brand-600 dark:text-brand-400"
                        iconBgColor="bg-brand-100 dark:bg-brand-900/20"
                    />
                    <MetricCard
                        title="Total Revenue"
                        value={formatCurrency(summary.total_revenue)}
                        icon={DollarSign}
                        iconColor="text-success-600 dark:text-success-400"
                        iconBgColor="bg-success-100 dark:bg-success-900/20"
                    />
                    <MetricCard
                        title="Avg Order Value"
                        value={formatCurrency(summary.avg_order_value)}
                        icon={TrendingUp}
                        iconColor="text-blue-600 dark:text-blue-400"
                        iconBgColor="bg-blue-100 dark:bg-blue-900/20"
                    />
                    <MetricCard
                        title="Total Discounts"
                        value={formatCurrency(summary.total_discounts)}
                        icon={Tag}
                        iconColor="text-purple-600 dark:text-purple-400"
                        iconBgColor="bg-purple-100 dark:bg-purple-900/20"
                    />
                    <MetricCard
                        title="Total Tax"
                        value={formatCurrency(summary.total_tax)}
                        icon={Receipt}
                        iconColor="text-orange-600 dark:text-orange-400"
                        iconBgColor="bg-orange-100 dark:bg-orange-900/20"
                    />
                    <MetricCard
                        title="Payment Rate"
                        value={`${summary.payment_rate.toFixed(1)}%`}
                        subtitle={`${summary.paid_orders} / ${summary.total_orders}`}
                        icon={PercentIcon}
                        iconColor="text-indigo-600 dark:text-indigo-400"
                        iconBgColor="bg-indigo-100 dark:bg-indigo-900/20"
                    />
                </div>

                {/* Filters */}
                <FilterBar
                    filters={filterConfig}
                    currentFilters={filters}
                    exportUrl="/reports/sales/export"
                />

                {/* Data Table */}
                <DataTable
                    columns={getColumns()}
                    data={salesData.data}
                    pagination={{
                        current_page: salesData.current_page,
                        per_page: salesData.per_page,
                        total: salesData.total,
                        last_page: salesData.last_page,
                    }}
                    emptyMessage="No sales data found for the selected filters"
                />
            </div>
        </>
    );
}

SalesReport.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
