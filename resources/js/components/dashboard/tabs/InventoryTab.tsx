import {  Package, AlertTriangle, DollarSign, Layers } from 'lucide-react';
import MetricCard from '../MetricCard';
import { InventoryData } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import ReusableBarChart from '@/components/charts/ReusableBarChart';

interface InventoryTabProps {
    data: InventoryData;
}

export default function InventoryTab({ data }: InventoryTabProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);

    const formatNumber = (value: number) =>
        new Intl.NumberFormat('en-NG').format(value);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Products"
                    value={formatNumber(data.summary.total_products)}
                    icon={Package}
                />
                <MetricCard
                    title="Total Variants"
                    value={formatNumber(data.summary.total_variants)}
                    icon={Layers}
                    iconColor="text-blue-light-600 dark:text-blue-light-400"
                    iconBgColor="bg-blue-light-100 dark:bg-blue-light-900/20"
                />
                <MetricCard
                    title="Inventory Value"
                    value={formatCurrency(data.summary.total_value)}
                    icon={DollarSign}
                    iconColor="text-success-600 dark:text-success-400"
                    iconBgColor="bg-success-100 dark:bg-success-900/20"
                />
                <MetricCard
                    title="Low Stock Items"
                    value={data.summary.low_stock_count}
                    icon={AlertTriangle}
                    iconColor="text-warning-600 dark:text-warning-400"
                    iconBgColor="bg-warning-100 dark:bg-warning-900/20"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Inventory Valuation by Shop" className="p-6">
                    <ReusableBarChart
                        data={data.valuation_by_shop.map((s) => s.valuation)}
                        labels={data.valuation_by_shop.map((s) => s.shop_name)}
                        color="#465fff"
                        height={300}
                    />
                </Card>

                <Card title="Recent Stock Movements" className="p-6">
                    <div className="space-y-3">
                        {data.stock_movements.map((movement) => (
                            <div
                                key={movement.id}
                                className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 dark:border-gray-700"
                            >
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {movement.product_name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {movement.shop_name} • {movement.type}
                                    </div>
                                </div>
                                <Badge
                                    variant="light"
                                    color={
                                        movement.quantity > 0 ? 'success' : 'error'
                                    }
                                >
                                    {movement.quantity > 0 ? '+' : ''}
                                    {movement.quantity}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {data.low_stock.length > 0 && (
                <Card title="Low Stock Alerts" className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Badge variant="solid" color="error">
                            {data.low_stock.length}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            Items below reorder level
                        </span>
                    </div>
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
                                        Current
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Reorder Level
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Deficit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {data.low_stock.map((item) => (
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
                                            {formatNumber(item.current_stock)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-white">
                                            {formatNumber(item.reorder_level)}
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
        </div>
    );
}
