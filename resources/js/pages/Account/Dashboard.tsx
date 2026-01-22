import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountDashboardProps } from '@/types/storefront';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Clock,
    DollarSign,
    Package,
    ShoppingBag,
    User,
} from 'lucide-react';
import React from 'react';

/**
 * Customer account dashboard with playful-luxury styling.
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

            <div className="space-y-6 sm:space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                        Welcome back, {customer.first_name}!
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">
                        Manage your orders and account settings
                    </p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400">
                                    Total Orders
                                </p>
                                <p className="mt-1 text-2xl font-bold text-gray-900 sm:mt-2 sm:text-3xl dark:text-white">
                                    {stats.total_orders}
                                </p>
                            </div>
                            <div className="rounded-xl bg-brand-100 p-2.5 sm:p-3 dark:bg-brand-500/20">
                                <ShoppingBag className="h-6 w-6 text-brand-600 sm:h-8 sm:w-8 dark:text-brand-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400">
                                    Pending Orders
                                </p>
                                <p className="mt-1 text-2xl font-bold text-gray-900 sm:mt-2 sm:text-3xl dark:text-white">
                                    {stats.pending_orders}
                                </p>
                            </div>
                            <div className="rounded-xl bg-warning-100 p-2.5 sm:p-3 dark:bg-warning-500/20">
                                <Clock className="h-6 w-6 text-warning-600 sm:h-8 sm:w-8 dark:text-warning-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400">
                                    Total Spent
                                </p>
                                <p className="mt-1 text-2xl font-bold text-gray-900 sm:mt-2 sm:text-3xl dark:text-white">
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
                            <div className="rounded-xl bg-success-100 p-2.5 sm:p-3 dark:bg-success-500/20">
                                <DollarSign className="h-6 w-6 text-success-600 sm:h-8 sm:w-8 dark:text-success-400" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800"
                >
                    <div className="border-b border-gray-100 p-4 sm:p-6 dark:border-navy-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Orders
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your most recent purchases
                        </p>
                    </div>

                    {recentOrders.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-navy-700">
                            {recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={CustomerPortalController.orderDetail.url(
                                        {
                                            shop: shop.slug,
                                            order: order.id,
                                        },
                                    )}
                                    className="block p-4 transition hover:bg-gray-50 sm:p-5 dark:hover:bg-navy-700/50"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <Package className="h-4 w-4 text-gray-400" />
                                                <span className="font-semibold text-gray-900 dark:text-white">
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
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(order.created_at)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">
                                                    {shop.currency_symbol}
                                                    {order.total_amount.toLocaleString(
                                                        undefined,
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {order.items?.length || 0}{' '}
                                                    items
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            <div className="p-4 sm:p-5">
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
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <Package className="mx-auto h-10 w-10 text-gray-300 dark:text-navy-500" />
                            <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-white">
                                No orders yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Start shopping to see your orders here.
                            </p>
                            <div className="mt-4">
                                <Link href={`/store/${shop.slug}/products`}>
                                    <Button variant="primary">
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                        href={CustomerPortalController.orders.url({
                            shop: shop.slug,
                        })}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-lg sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-brand-500"
                        >
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-brand-100 p-3 transition-transform group-hover:scale-110 dark:bg-brand-500/20">
                                    <ShoppingBag className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Order History
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        View all your orders
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </Link>

                    <Link
                        href={CustomerPortalController.profile.url({
                            shop: shop.slug,
                        })}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-lg sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-brand-500"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-info-100 dark:bg-info-500/20 rounded-xl p-3 transition-transform group-hover:scale-110">
                                    <User className="text-info-600 dark:text-info-400 h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Profile Settings
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Update your information
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default Dashboard;
