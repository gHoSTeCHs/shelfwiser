import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountDashboardProps } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import { Package, ShoppingBag, DollarSign } from 'lucide-react';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

/**
 * Customer account dashboard page.
 * Displays order statistics and recent order history.
 */
const Dashboard: React.FC<AccountDashboardProps> = ({ shop, customer, stats, recentOrders }) => {
    return (
        <StorefrontLayout shop={shop} customer={customer}>
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Welcome back, {customer.first_name}!
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-3xl font-bold mt-2">{stats.total_orders}</p>
                            </div>
                            <div className="bg-brand-100 p-3 rounded-full">
                                <Package className="w-8 h-8 text-brand-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Orders</p>
                                <p className="text-3xl font-bold mt-2">{stats.pending_orders}</p>
                            </div>
                            <div className="bg-warning-100 p-3 rounded-full">
                                <ShoppingBag className="w-8 h-8 text-warning-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Spent</p>
                                <p className="text-3xl font-bold mt-2">
                                    {shop.currency_symbol}{stats.total_spent.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-success-100 p-3 rounded-full">
                                <DollarSign className="w-8 h-8 text-success-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Recent Orders</h2>
                        <Link
                            href={CustomerPortalController.orders.url({ shop: shop.slug })}
                            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                        >
                            View All
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No orders yet</p>
                            <Link
                                href={StorefrontController.products.url({ shop: shop.slug })}
                                className="text-brand-600 hover:text-brand-700 font-medium"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={CustomerPortalController.orderDetail.url({ shop: shop.slug, order: order.id })}
                                    className="block border border-gray-200 rounded-lg p-4 hover:border-brand-300 hover:shadow-sm transition"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold">{order.order_number}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge color={
                                                order.status === 'delivered' ? 'success' :
                                                order.status === 'cancelled' ? 'error' :
                                                order.status === 'processing' ? 'info' :
                                                'warning'
                                            }>
                                                {order.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                            <p className="text-sm font-semibold mt-2">
                                                {shop.currency_symbol}{order.total_amount.toFixed(2)}
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
