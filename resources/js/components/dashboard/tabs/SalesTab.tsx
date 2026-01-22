import ReusableBarChart from '@/components/charts/ReusableBarChart';
import ReusableLineChart from '@/components/charts/ReusableLineChart';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { SalesData } from '@/types/dashboard';
import { DollarSign, ShoppingCart, Tag, TrendingUp } from 'lucide-react';
import MetricCard from '../MetricCard';

interface SalesTabProps {
    data: SalesData;
}

export default function SalesTab({ data }: SalesTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Orders"
                    value={formatNumber(data.summary.total_orders, 0, 'en-NG')}
                    icon={ShoppingCart}
                />
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(data.summary.total_revenue)}
                    icon={DollarSign}
                />
                <MetricCard
                    title="Avg Order Value"
                    value={formatCurrency(data.summary.avg_order_value)}
                    icon={TrendingUp}
                    iconColor="text-success-600 dark:text-success-400"
                    iconBgColor="bg-success-100 dark:bg-success-900/20"
                />
                <MetricCard
                    title="Total Discounts"
                    value={formatCurrency(data.summary.total_discounts)}
                    icon={Tag}
                    iconColor="text-warning-600 dark:text-warning-400"
                    iconBgColor="bg-warning-100 dark:bg-warning-900/20"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Revenue Trend" className="p-6">
                    <ReusableLineChart
                        data={data.revenue_trend.data}
                        labels={data.revenue_trend.labels}
                        color="#465fff"
                        height={300}
                    />
                </Card>

                <Card title="Revenue by Shop" className="p-6">
                    <ReusableBarChart
                        data={data.revenue_by_shop.map((s) => s.revenue)}
                        labels={data.revenue_by_shop.map((s) => s.shop_name)}
                        color="#34d399"
                        height={300}
                    />
                </Card>
            </div>

            <Card title="Top Selling Products" className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Product
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    SKU
                                </th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Quantity Sold
                                </th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
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
                                        {formatNumber(product.total_quantity, 0, 'en-NG')}
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
        </div>
    );
}
