import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import useCurrency from '@/hooks/useCurrency';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { formatDateShort } from '@/lib/formatters';
import { getOrderStatusColor, getPaymentStatusColor } from '@/lib/status-configs';
import { AccountOrderDetailProps } from '@/types/storefront';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    MapPin,
    Package,
    Truck,
} from 'lucide-react';
import React from 'react';

/**
 * Customer order detail page with playful-luxury styling.
 */
const OrderDetail: React.FC<AccountOrderDetailProps> = ({ shop, order }) => {
    const { formatCurrency } = useCurrency(shop);
    return (
        <StorefrontLayout shop={shop}>
            <Head title={`Order #${order.order_number} - ${shop.name}`} />

            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href={CustomerPortalController.orders.url({
                        shop: shop.slug,
                    })}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        startIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back to Orders
                    </Button>
                </Link>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                            Order #{order.order_number}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Placed on {formatDateShort(order.created_at)}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge color={getOrderStatusColor(order.status)} size="md">
                            {order.status}
                        </Badge>
                        <Badge
                            color={getPaymentStatusColor(order.payment_status)}
                            size="md"
                        >
                            {order.payment_status}
                        </Badge>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    {/* Main Content */}
                    <div className="space-y-4 lg:col-span-2 lg:space-y-6">
                        {/* Order Items */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-xl border border-gray-200 bg-white sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800"
                        >
                            <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-navy-700">
                                <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                    <Package className="h-4 w-4 text-brand-500" />
                                    Order Items
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-navy-700">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="p-4 sm:p-5">
                                        <div className="flex gap-3 sm:gap-4">
                                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 sm:h-20 sm:w-20 dark:bg-navy-700">
                                                <Package className="h-6 w-6 text-gray-400 sm:h-8 sm:w-8 dark:text-gray-500" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-medium text-gray-900 sm:text-base dark:text-white">
                                                    {item.product_variant
                                                        ?.product?.name ||
                                                        'Product'}
                                                </h4>
                                                {item.product_variant?.sku && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        SKU:{' '}
                                                        {
                                                            item.product_variant
                                                                .sku
                                                        }
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900 sm:text-base dark:text-white">
                                                    {formatCurrency(item.unit_price)}
                                                </p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Total:{' '}
                                                        {formatCurrency(item.unit_price * item.quantity)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800"
                            >
                                <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                    <MapPin className="h-4 w-4 text-brand-500" />
                                    Shipping Address
                                </h2>
                                <pre className="font-sans text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                                    {order.shipping_address}
                                </pre>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 lg:space-y-6">
                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800"
                        >
                            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
                                Order Summary
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Subtotal
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                        {formatCurrency(order.subtotal)}
                                    </span>
                                </div>

                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Tax
                                        </span>
                                        <span className="text-gray-900 dark:text-white">
                                            {formatCurrency(order.tax_amount)}
                                        </span>
                                    </div>
                                )}

                                {order.shipping_cost > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Shipping
                                        </span>
                                        <span className="text-gray-900 dark:text-white">
                                            {formatCurrency(order.shipping_cost)}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-2 dark:border-navy-700">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            Total
                                        </span>
                                        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                                            {formatCurrency(order.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Payment Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800"
                        >
                            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                <CreditCard className="h-4 w-4 text-brand-500" />
                                Payment
                            </h2>
                            <p className="text-sm font-medium text-gray-900 capitalize dark:text-white">
                                {order.payment_method.replace('_', ' ')}
                            </p>
                        </motion.div>

                        {/* Tracking */}
                        {order.tracking_number && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800"
                            >
                                <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                    <Truck className="h-4 w-4 text-brand-500" />
                                    Tracking
                                </h2>
                                <p className="font-mono rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-navy-700 dark:text-white">
                                    {order.tracking_number}
                                </p>
                            </motion.div>
                        )}

                        {/* Timeline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800"
                        >
                            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
                                Timeline
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                                        <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            Order Placed
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDateShort(order.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default OrderDetail;
