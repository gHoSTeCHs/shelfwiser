import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { SupplierReportProps } from '@/types/reports';
import FilterBar from '@/components/reports/FilterBar';
import DataTable from '@/components/reports/DataTable';
import { Card } from '@/components/ui/card';

export default function SupplierReport({
    performanceSummary,
    supplierData,
    shops,
    filters,
    poStatuses,
    paymentStatuses,
    canViewCosts,
}: SupplierReportProps) {
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
            name: 'status',
            label: 'PO Status',
            type: 'select' as const,
            options: Object.entries(poStatuses).map(([value, label]) => ({
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
    ];

    const poColumns = [
        {
            key: 'po_number',
            label: 'PO Number',
        },
        {
            key: 'supplier_tenant',
            label: 'Supplier',
            render: (_: any, row: any) => row.supplier_tenant?.name || '-',
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
            key: 'paid_amount',
            label: 'Paid',
            className: 'text-right',
            render: (value: number) => formatCurrency(value),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string) => (
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-800 dark:bg-gray-800 dark:text-gray-200">
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
                            : value === 'overdue'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
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

    return (
        <>
            <Head title="Supplier Report" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Supplier Report
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Track supplier performance and purchase order metrics
                    </p>
                </div>

                {/* Performance Summary */}
                {performanceSummary.length > 0 && (
                    <Card title="Top Suppliers Performance" className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Supplier
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            PO Count
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Total Spend
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Avg PO Value
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Completion Rate
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Avg Lead Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {performanceSummary.map((supplier) => (
                                        <tr
                                            key={supplier.supplier_tenant_id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {supplier.supplier_tenant?.name}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                                                {supplier.po_count}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(supplier.total_spend)}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                                                {formatCurrency(supplier.avg_po_value)}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                                                {((supplier.completed_count / supplier.po_count) * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                                                {Number(supplier.avg_lead_time).toFixed(0)} days
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Filters */}
                <FilterBar
                    filters={filterConfig}
                    currentFilters={filters}
                    exportUrl="/reports/suppliers/export"
                />

                {/* Purchase Orders Table */}
                <DataTable
                    columns={poColumns}
                    data={supplierData.data}
                    pagination={{
                        current_page: supplierData.current_page,
                        per_page: supplierData.per_page,
                        total: supplierData.total,
                        last_page: supplierData.last_page,
                    }}
                    emptyMessage="No purchase orders found for the selected filters"
                />
            </div>
        </>
    );
}

SupplierReport.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
