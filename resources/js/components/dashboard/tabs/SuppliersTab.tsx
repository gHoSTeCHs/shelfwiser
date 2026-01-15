import ReusableBarChart from '@/components/charts/ReusableBarChart';
import ReusablePieChart from '@/components/charts/ReusablePieChart';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import { SupplierData } from '@/types/dashboard';
import { AlertTriangle, DollarSign, FileText, TrendingUp } from 'lucide-react';
import MetricCard from '../MetricCard';

interface SuppliersTabProps {
    data: SupplierData;
}

export default function SuppliersTab({ data }: SuppliersTabProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Active Suppliers"
                    value={data.summary.total_suppliers}
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Active Purchase Orders"
                    value={data.summary.active_pos}
                    icon={FileText}
                    iconColor="text-blue-light-600 dark:text-blue-light-400"
                    iconBgColor="bg-blue-light-100 dark:bg-blue-light-900/20"
                />
                <MetricCard
                    title="Pending Payments"
                    value={formatCurrency(data.summary.pending_payments)}
                    icon={DollarSign}
                    iconColor="text-warning-600 dark:text-warning-400"
                    iconBgColor="bg-warning-100 dark:bg-warning-900/20"
                />
                <MetricCard
                    title="Overdue Payments"
                    value={formatCurrency(data.summary.overdue_payments)}
                    icon={AlertTriangle}
                    iconColor="text-error-600 dark:text-error-400"
                    iconBgColor="bg-error-100 dark:bg-error-900/20"
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Top Suppliers by Spend" className="p-6">
                    <ReusableBarChart
                        data={data.top_suppliers.map((s) => s.total_spend)}
                        labels={data.top_suppliers.map((s) => s.supplier_name)}
                        color="#465fff"
                        height={300}
                        horizontal
                    />
                </Card>

                <Card title="Payment Status Breakdown" className="p-6">
                    <ReusablePieChart
                        data={Object.values(data.payment_status_breakdown).map(
                            (item) => item.count,
                        )}
                        labels={Object.values(
                            data.payment_status_breakdown,
                        ).map((item) => item.label)}
                    />
                </Card>
            </div>

            {/* Recent Purchase Orders */}
            <Card title="Recent Purchase Orders" className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    PO Number
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Supplier
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Shop
                                </th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Amount
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {data.recent_pos.map((po) => (
                                <tr
                                    key={po.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {po.po_number}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {po.supplier_name}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {po.shop_name}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(po.total_amount)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant="light" color="info">
                                            {po.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
