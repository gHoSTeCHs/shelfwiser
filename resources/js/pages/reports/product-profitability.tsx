import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { ProductProfitabilityProps } from '@/types/reports';
import FilterBar from '@/components/reports/FilterBar';
import DataTable from '@/components/reports/DataTable';
import MetricCard from '@/components/dashboard/MetricCard';
import { Package, DollarSign, TrendingUp, PercentIcon, ShoppingCart } from 'lucide-react';

export default function ProductProfitability({
    summary,
    productData,
    shops,
    categories,
    filters,
}: ProductProfitabilityProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);

    const formatPercent = (value: number) =>
        `${value.toFixed(2)}%`;

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
            name: 'sort_by',
            label: 'Sort By',
            type: 'select' as const,
            options: [
                { label: 'Gross Profit', value: 'profit' },
                { label: 'Profit Margin %', value: 'margin' },
                { label: 'Revenue', value: 'revenue' },
                { label: 'Units Sold', value: 'quantity' },
            ],
            value: filters.sort_by,
        },
    ];

    const columns = [
        {
            key: 'product',
            label: 'Product',
            render: (_: any, row: any) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.productVariant?.product?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {row.productVariant?.sku || 'N/A'}
                    </div>
                    {row.productVariant?.product?.category && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {row.productVariant.product.category.name}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'total_quantity',
            label: 'Units Sold',
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
            key: 'total_cogs',
            label: 'COGS',
            className: 'text-right',
            render: (value: number) => formatCurrency(value),
        },
        {
            key: 'gross_profit',
            label: 'Gross Profit',
            className: 'text-right',
            render: (value: number) => (
                <span className={value >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                    {formatCurrency(value)}
                </span>
            ),
        },
        {
            key: 'profit_margin',
            label: 'Margin %',
            className: 'text-right',
            render: (value: number) => (
                <span className={value >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                    {formatPercent(value)}
                </span>
            ),
        },
        {
            key: 'avg_selling_price',
            label: 'Avg Price',
            className: 'text-right',
            render: (value: number) => formatCurrency(value),
        },
        {
            key: 'cost_price',
            label: 'Cost Price',
            className: 'text-right',
            render: (value: number) => formatCurrency(value),
        },
    ];

    return (
        <>
            <Head title="Product Profitability" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Product Profitability
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Analyze product-level profitability, margins, and performance
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <MetricCard
                        title="Units Sold"
                        value={summary.total_units_sold.toLocaleString()}
                        icon={Package}
                        iconColor="text-brand-600 dark:text-brand-400"
                        iconBgColor="bg-brand-100 dark:bg-brand-900/20"
                    />
                    <MetricCard
                        title="Total Revenue"
                        value={formatCurrency(summary.total_revenue)}
                        icon={DollarSign}
                        iconColor="text-blue-600 dark:text-blue-400"
                        iconBgColor="bg-blue-100 dark:bg-blue-900/20"
                    />
                    <MetricCard
                        title="Total COGS"
                        value={formatCurrency(summary.total_cogs)}
                        icon={ShoppingCart}
                        iconColor="text-orange-600 dark:text-orange-400"
                        iconBgColor="bg-orange-100 dark:bg-orange-900/20"
                    />
                    <MetricCard
                        title="Gross Profit"
                        value={formatCurrency(summary.gross_profit)}
                        icon={TrendingUp}
                        iconColor="text-success-600 dark:text-success-400"
                        iconBgColor="bg-success-100 dark:bg-success-900/20"
                    />
                    <MetricCard
                        title="Avg Margin"
                        value={formatPercent(summary.avg_margin)}
                        icon={PercentIcon}
                        iconColor="text-purple-600 dark:text-purple-400"
                        iconBgColor="bg-purple-100 dark:bg-purple-900/20"
                    />
                </div>

                {/* Filters */}
                <FilterBar
                    filters={filterConfig}
                    currentFilters={filters}
                    exportUrl="/reports/product-profitability/export"
                />

                {/* Data Table */}
                <DataTable
                    columns={columns}
                    data={productData.data}
                    pagination={{
                        current_page: productData.current_page,
                        per_page: productData.per_page,
                        total: productData.total,
                        last_page: productData.last_page,
                    }}
                    emptyMessage="No product profitability data found for the selected filters"
                />
            </div>
        </>
    );
}

ProductProfitability.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
