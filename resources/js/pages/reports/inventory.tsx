import MetricCard from '@/components/dashboard/MetricCard';
import DataTable from '@/components/reports/DataTable';
import FilterBar from '@/components/reports/FilterBar';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { InventoryReportProps } from '@/types/reports';
import { Head } from '@inertiajs/react';
import { AlertTriangle, Box, DollarSign, Package } from 'lucide-react';

export default function InventoryReport({
    summary,
    inventoryData,
    shops,
    categories,
    filters,
    canViewCosts,
}: InventoryReportProps) {
    const filterConfig = [
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
            name: 'stock_status',
            label: 'Stock Status',
            type: 'select' as const,
            options: [
                { label: 'Low Stock', value: 'low' },
                { label: 'Adequate', value: 'adequate' },
                { label: 'Overstocked', value: 'overstocked' },
            ],
            value: filters.stock_status,
        },
    ];

    const columns = [
        {
            key: 'product',
            label: 'Product',
            render: (_: any, row: any) => (
                <div>
                    <div className="font-medium">{row.product?.name}</div>
                    <div className="text-xs text-gray-500">SKU: {row.sku}</div>
                </div>
            ),
        },
        {
            key: 'product.shop',
            label: 'Shop',
            render: (_: any, row: any) => row.product?.shop?.name || '-',
        },
        {
            key: 'stock',
            label: 'Stock Level',
            className: 'text-right',
            render: (_: any, row: any) => {
                const totalStock =
                    row.inventory_locations?.reduce(
                        (sum: number, loc: any) => sum + loc.quantity,
                        0,
                    ) || 0;

                const isLow =
                    row.reorder_level && totalStock <= row.reorder_level;

                return (
                    <div className="flex items-center justify-end gap-2">
                        <span
                            className={
                                isLow ? 'font-medium text-error-600' : ''
                            }
                        >
                            {formatNumber(totalStock, 0)}
                        </span>
                        {isLow && (
                            <AlertTriangle className="h-4 w-4 text-error-600" />
                        )}
                    </div>
                );
            },
        },
        {
            key: 'reorder_level',
            label: 'Reorder Level',
            className: 'text-right',
            render: (value: unknown) => value ? formatNumber(value as number, 0) : '-',
        },
        ...(canViewCosts
            ? [
                  {
                      key: 'cost_price',
                      label: 'Cost Price',
                      className: 'text-right',
                      render: (value: unknown) =>
                          value ? formatCurrency(value as number) : '-',
                  },
                  {
                      key: 'valuation',
                      label: 'Total Value',
                      className: 'text-right',
                      render: (_: any, row: any) => {
                          const totalStock =
                              row.inventory_locations?.reduce(
                                  (sum: number, loc: any) => sum + loc.quantity,
                                  0,
                              ) || 0;
                          const value = totalStock * (row.cost_price || 0);
                          return formatCurrency(value);
                      },
                  },
              ]
            : []),
    ];

    return (
        <>
            <Head title="Inventory Report" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Inventory Report
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Track stock levels, valuations, and inventory status
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Products"
                        value={formatNumber(summary.total_products, 0)}
                        icon={Package}
                        iconColor="text-brand-600 dark:text-brand-400"
                        iconBgColor="bg-brand-100 dark:bg-brand-900/20"
                    />
                    <MetricCard
                        title="Total Variants"
                        value={formatNumber(summary.total_variants, 0)}
                        icon={Box}
                        iconColor="text-blue-600 dark:text-blue-400"
                        iconBgColor="bg-blue-100 dark:bg-blue-900/20"
                    />
                    {canViewCosts && (
                        <MetricCard
                            title="Total Valuation"
                            value={formatCurrency(summary.total_value)}
                            icon={DollarSign}
                            iconColor="text-success-600 dark:text-success-400"
                            iconBgColor="bg-success-100 dark:bg-success-900/20"
                        />
                    )}
                    <MetricCard
                        title="Low Stock Items"
                        value={formatNumber(summary.low_stock_count, 0)}
                        icon={AlertTriangle}
                        iconColor="text-error-600 dark:text-error-400"
                        iconBgColor="bg-error-100 dark:bg-error-900/20"
                    />
                </div>

                {/* Filters */}
                <FilterBar
                    filters={filterConfig}
                    currentFilters={filters}
                    exportUrl="/reports/inventory/export"
                />

                {/* Data Table */}
                <DataTable
                    columns={columns}
                    data={inventoryData.data}
                    pagination={{
                        current_page: inventoryData.current_page,
                        per_page: inventoryData.per_page,
                        total: inventoryData.total,
                        last_page: inventoryData.last_page,
                    }}
                    emptyMessage="No inventory data found for the selected filters"
                />
            </div>
        </>
    );
}

InventoryReport.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
