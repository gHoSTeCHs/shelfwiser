import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountDashboardProps } from '@/types/storefront';
import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import {
    Package,
    Clock,
    DollarSign,
    ShoppingBag,
    ArrowRight,
    User,
} from 'lucide-react';

/**
 * Customer account dashboard page.
 * Shows order statistics and recent order history.
 */
const Dashboard: React.FC<AccountDashboardProps> = ({
    shop,
    customer,
    stats,
    recentOrders,
}) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'delivered':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
            case 'failed':
                return 'error';
            case 'processing':
            case 'confirmed':
                return 'info';
            default:
                return 'light';
        }
    };

    const getPaymentStatusColor = (paymentStatus: string) => {
        switch (paymentStatus.toLowerCase()) {
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
            case 'refunded':
                return 'error';
            default:
                return 'light';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <StorefrontLayout shop={shop} customer={customer}>
            <Head title={`My Account - ${shop.name}`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, {customer.first_name}!
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Manage your orders and account settings
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Orders
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {stats.total_orders}
                                </p>
                            </div>
                            <div className="p-3 bg-primary-100 rounded-lg">
                                <ShoppingBag className="h-8 w-8 text-primary-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Pending Orders
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {stats.pending_orders}
                                </p>
                            </div>
                            <div className="p-3 bg-warning-100 rounded-lg">
                                <Clock className="h-8 w-8 text-warning-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Spent
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {shop.currency_symbol}
                                    {stats.total_spent.toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                </p>
                            </div>
                            <div className="p-3 bg-success-100 rounded-lg">
                                <DollarSign className="h-8 w-8 text-success-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Orders */}
                <Card
                    title="Recent Orders"
                    description="Your most recent purchases"
                >
                    {recentOrders.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={CustomerPortalController.orderDetail.url(
                                            {
                                                shop: shop.slug,
                                                order: order.id,
                                            },
                                        )}
                                        className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Package className="h-5 w-5 text-gray-400" />
                                                    <span className="font-semibold text-gray-900">
                                                        #{order.order_number}
                                                    </span>
                                                    <Badge
                                                        color={getStatusColor(
                                                            order.status,
                                                        )}
                                                        size="sm"
                                                    >
                                                        {order.status}
                                                    </Badge>
                                                    <Badge
                                                        color={getPaymentStatusColor(
                                                            order.payment_status,
                                                        )}
                                                        size="sm"
                                                    >
                                                        {order.payment_status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {formatDate(order.created_at)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {shop.currency_symbol}
                                                        {order.total_amount.toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {order.items?.length ||
                                                            0}{' '}
                                                        items
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-6">
                                <Link
                                    href={CustomerPortalController.orders.url({
                                        shop: shop.slug,
                                    })}
                                >
                                    <Button variant="outline" fullWidth>
                                        View All Orders
                                    </Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                                No orders yet
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Start shopping to see your orders here.
                            </p>
                            <div className="mt-6">
                                <Link href={`/store/${shop.slug}/products`}>
                                    <Button variant="primary">
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Quick Links */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        href={CustomerPortalController.orders.url({
                            shop: shop.slug,
                        })}
                    >
                        <Card className="p-6 hover:shadow-lg transition cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-100 rounded-lg">
                                    <ShoppingBag className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        Order History
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        View all your orders
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Link>

                    <Link
                        href={CustomerPortalController.profile.url({
                            shop: shop.slug,
                        })}
                    >
                        <Card className="p-6 hover:shadow-lg transition cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-info-100 rounded-lg">
                                    <User className="h-6 w-6 text-info-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        Profile Settings
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Update your information
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default Dashboard;
