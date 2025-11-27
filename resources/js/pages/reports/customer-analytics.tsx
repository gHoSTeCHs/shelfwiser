import MetricCard from '@/components/dashboard/MetricCard';
import DataTable from '@/components/reports/DataTable';
import FilterBar from '@/components/reports/FilterBar';
import AppLayout from '@/layouts/AppLayout';
import { CustomerAnalyticsProps } from '@/types/reports';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    DollarSign,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';

export default function CustomerAnalytics({
    summary,
    customerData,
    shops,
    filters,
}: CustomerAnalyticsProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);

    const formatDate = (dateString: string | null) =>
        dateString
            ? new Date(dateString).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
              })
            : '-';

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
            name: 'segment',
            label: 'Customer Segment',
            type: 'select' as const,
            options: [
                { label: 'All Customers', value: 'all' },
                { label: 'High Value (>₦10k)', value: 'high_value' },
                { label: 'At Risk (30-90 days)', value: 'at_risk' },
                { label: 'Inactive (>90 days)', value: 'inactive' },
            ],
            value: filters.segment,
        },
    ];

    const columns = [
        {
            key: 'customer',
            label: 'Customer',
            render: (_: any, row: any) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.customer?.first_name} {row.customer?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {row.customer?.email}
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
            key: 'lifetime_value',
            label: 'Lifetime Value',
            className: 'text-right',
            render: (value: number) => formatCurrency(value),
        },
        {
            key: 'last_order_date',
            label: 'Last Order',
            render: (value: string) => formatDate(value),
        },
        {
            key: 'days_since_last_order',
            label: 'Days Since Order',
            className: 'text-right',
            render: (value: number) => `${value} days`,
        },
        {
            key: 'customer_status',
            label: 'Status',
            render: (value: string) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        value === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : value === 'At Risk'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                >
                    {value}
                </span>
            ),
        },
    ];

    return (
        <>
            <Head title="Customer Analytics" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Customer Analytics
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Analyze customer behavior, lifetime value, and
                        engagement patterns
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <MetricCard
                        title="Total Customers"
                        value={summary.total_customers.toLocaleString()}
                        icon={Users}
                        iconColor="text-brand-600 dark:text-brand-400"
                        iconBgColor="bg-brand-100 dark:bg-brand-900/20"
                    />
                    <MetricCard
                        title="Total Orders"
                        value={summary.total_orders.toLocaleString()}
                        icon={ShoppingCart}
                        iconColor="text-blue-600 dark:text-blue-400"
                        iconBgColor="bg-blue-100 dark:bg-blue-900/20"
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
                        iconColor="text-purple-600 dark:text-purple-400"
                        iconBgColor="bg-purple-100 dark:bg-purple-900/20"
                    />
                    <MetricCard
                        title="High Value"
                        value={summary.high_value_customers.toLocaleString()}
                        subtitle="Customers >₦10k"
                        icon={TrendingUp}
                        iconColor="text-green-600 dark:text-green-400"
                        iconBgColor="bg-green-100 dark:bg-green-900/20"
                    />
                    <MetricCard
                        title="At Risk"
                        value={summary.at_risk_customers.toLocaleString()}
                        subtitle="30-90 days inactive"
                        icon={AlertTriangle}
                        iconColor="text-yellow-600 dark:text-yellow-400"
                        iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
                    />
                    <MetricCard
                        title="Inactive"
                        value={summary.inactive_customers.toLocaleString()}
                        subtitle=">90 days inactive"
                        icon={TrendingDown}
                        iconColor="text-error-600 dark:text-error-400"
                        iconBgColor="bg-error-100 dark:bg-error-900/20"
                    />
                </div>

                {/* Filters */}
                <FilterBar
                    filters={filterConfig}
                    currentFilters={filters}
                    exportUrl="/reports/customer-analytics/export"
                />

                {/* Data Table */}
                <DataTable
                    columns={columns}
                    data={customerData.data}
                    pagination={{
                        current_page: customerData.current_page,
                        per_page: customerData.per_page,
                        total: customerData.total,
                        last_page: customerData.last_page,
                    }}
                    emptyMessage="No customer data found for the selected filters"
                />
            </div>
        </>
    );
}

CustomerAnalytics.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
