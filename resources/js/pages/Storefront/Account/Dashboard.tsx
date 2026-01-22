import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import useCurrency from '@/hooks/useCurrency';
import { formatDateLong } from '@/lib/formatters';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { getOrderStatusColor, getOrderStatusLabel, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/status-configs';
import { AccountDashboardProps } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import { DollarSign, Package, ShoppingBag } from 'lucide-react';
import React from 'react';

/**
 * Customer account dashboard page.
 * Displays order statistics and recent order history.
 */
const Dashboard: React.FC<AccountDashboardProps> = ({
    shop,
    customer,
    stats,
    recentOrders,
}) => {
    const { formatCurrency } = useCurrency(shop);
    return (
        <StorefrontLayout shop={shop} customer={customer}>
            <div className="mx-auto max-w-6xl">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                    Welcome back, {customer.first_name}!
                </h1>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Orders
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {stats.total_orders}
                                </p>
                            </div>
                            <div className="rounded-full bg-brand-100 p-3">
                                <Package className="h-8 w-8 text-brand-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Pending Orders
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {stats.pending_orders}
                                </p>
                            </div>
                            <div className="rounded-full bg-warning-100 p-3">
                                <ShoppingBag className="h-8 w-8 text-warning-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Spent
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {formatCurrency(stats.total_spent)}
                                </p>
                            </div>
                            <div className="rounded-full bg-success-100 p-3">
                                <DollarSign className="h-8 w-8 text-success-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Orders</h2>
                        <Link
                            href={CustomerPortalController.orders.url({
                                shop: shop.slug,
                            })}
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                            View All
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="py-12 text-center">
                            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                            <p className="mb-4 text-gray-600">No orders yet</p>
                            <Link
                                href={StorefrontController.products.url({
                                    shop: shop.slug,
                                })}
                                className="font-medium text-brand-600 hover:text-brand-700"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={CustomerPortalController.orderDetail.url(
                                        { shop: shop.slug, order: order.id },
                                    )}
                                    className="block rounded-lg border border-gray-200 p-4 transition hover:border-brand-300 hover:shadow-sm"
                                >
                                    <div className="mb-2 flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold">
                                                {order.order_number}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {formatDateLong(order.created_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge color={getOrderStatusColor(order.status)}>
                                                {getOrderStatusLabel(order.status)}
                                            </Badge>
                                            <p className="mt-2 text-sm font-semibold">
                                                {formatCurrency(order.total_amount)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {order.items?.length || 0} item(s)
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </StorefrontLayout>
    );
};

export default Dashboard;
