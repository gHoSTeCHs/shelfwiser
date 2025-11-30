import ReorderAlertController from '@/actions/App/Http/Controllers/ReorderAlertController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { ProductVariant } from '@/types/stockMovement';
import { Shop } from '@/types/shop';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, ArrowLeft, Package, ShoppingCart } from 'lucide-react';

interface LowStockItem {
    variant: ProductVariant;
    current_stock: number;
    reorder_level: number;
    shortage: number;
    percentage: number;
}

interface Summary {
    total_low_stock: number;
    critical_count: number;
    warning_count: number;
    critical_items: LowStockItem[];
    top_priority: LowStockItem[];
}

interface Props {
    shop?: Shop;
    low_stock_items: LowStockItem[];
    summary: Summary;
}

export default function Index({ shop, low_stock_items, summary }: Props) {
    const getSeverityColor = (percentage: number): string => {
        if (percentage < 25) return 'error';
        if (percentage < 50) return 'warning';
        return 'info';
    };

    const getSeverityBadge = (percentage: number) => {
        if (percentage < 25) {
            return (
                <Badge color="error" size="sm">
                    Critical
                </Badge>
            );
        }
        if (percentage < 50) {
            return (
                <Badge color="warning" size="sm">
                    Warning
                </Badge>
            );
        }
        return (
            <Badge color="info" size="sm">
                Low
            </Badge>
        );
    };

    return (
        <AppLayout>
            <Head title={shop ? `Reorder Alerts - ${shop.name}` : 'Reorder Alerts'} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        {shop && (
                            <Link
                                href={`/shops/${shop.id}`}
                                className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Shop
                            </Link>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Reorder Alerts{shop ? ` - ${shop.name}` : ''}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Monitor products below their reorder level and take action
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Low Stock
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {summary.total_low_stock}
                                </p>
                            </div>
                            <div className="rounded-lg bg-info-100 p-3 dark:bg-info-950/30">
                                <Package className="h-8 w-8 text-info-600 dark:text-info-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Critical Items
                                </p>
                                <p className="mt-2 text-3xl font-bold text-error-600 dark:text-error-400">
                                    {summary.critical_count}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Below 25% of reorder level
                                </p>
                            </div>
                            <div className="rounded-lg bg-error-100 p-3 dark:bg-error-950/30">
                                <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Warning Items
                                </p>
                                <p className="mt-2 text-3xl font-bold text-warning-600 dark:text-warning-400">
                                    {summary.warning_count}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Between 25-50% of reorder level
                                </p>
                            </div>
                            <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-950/30">
                                <AlertTriangle className="h-8 w-8 text-warning-600 dark:text-warning-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Low Stock Items Table */}
                {low_stock_items.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="All stock levels are healthy"
                        description="There are no products below their reorder level at this time."
                    />
                ) : (
                    <Card className="overflow-hidden">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Low Stock Products
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Products that need to be reordered, sorted by urgency
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            SKU
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Current Stock
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Reorder Level
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Shortage
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                    {low_stock_items.map((item) => (
                                        <tr
                                            key={item.variant.id}
                                            className={
                                                item.percentage < 25
                                                    ? 'bg-error-50 dark:bg-error-950/20'
                                                    : item.percentage < 50
                                                      ? 'bg-warning-50 dark:bg-warning-950/20'
                                                      : ''
                                            }
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.variant.product?.name || 'Unknown Product'}
                                                    </div>
                                                    {item.variant.name && (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {item.variant.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {item.variant.sku}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                <span
                                                    className={
                                                        item.percentage < 25
                                                            ? 'font-semibold text-error-600 dark:text-error-400'
                                                            : item.percentage < 50
                                                              ? 'font-semibold text-warning-600 dark:text-warning-400'
                                                              : 'text-gray-900 dark:text-white'
                                                    }
                                                >
                                                    {item.current_stock}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                                                {item.reorder_level}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-error-600 dark:text-error-400">
                                                {item.shortage}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    {getSeverityBadge(item.percentage)}
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                <Link
                                                    href={`/products/${item.variant.product_id}`}
                                                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                                >
                                                    <Button size="sm" variant="outline">
                                                        <ShoppingCart className="mr-1 h-4 w-4" />
                                                        Reorder
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

Index.layout = (page: React.ReactNode) => page;
