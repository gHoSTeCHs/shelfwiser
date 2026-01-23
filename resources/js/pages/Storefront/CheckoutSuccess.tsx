import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import useCurrency from '@/hooks/useCurrency';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { getOrderStatusColor, getOrderStatusLabel, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/status-configs';
import { Service, ServiceVariant } from '@/types/service';
import { CheckoutSuccessProps, OrderItem } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Package, Receipt, Truck } from 'lucide-react';
import React from 'react';

/**
 * Order confirmation page with celebration animation.
 * Shows order details and next steps.
 */
const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({ shop, order }) => {
    const { formatCurrency } = useCurrency(shop);
    const shippingAddress = JSON.parse(order.shipping_address);

    const isProduct = (item: OrderItem) => {
        return (
            item.sellable_type === 'App\\Models\\ProductVariant' ||
            item.product_variant_id
        );
    };

    const isService = (item: OrderItem) => {
        return item.sellable_type === 'App\\Models\\ServiceVariant';
    };

    const getItemName = (item: OrderItem) => {
        if (isProduct(item)) {
            return item.product_variant?.product?.name || 'Product';
        } else if (isService(item)) {
            const serviceVariant = item.sellable as (ServiceVariant & { service?: Service }) | undefined;
            return serviceVariant?.service?.name || 'Service';
        }
        return 'Item';
    };

    const getItemDetails = (item: OrderItem) => {
        if (isProduct(item)) {
            return `${item.product_variant?.sku} × ${item.quantity}`;
        } else if (isService(item)) {
            const details = [item.sellable?.name];
            if (item.quantity > 1) {
                details.push(`× ${item.quantity}`);
            }
            return details.join(' ');
        }
        return `Qty: ${item.quantity}`;
    };

    return (
        <StorefrontLayout shop={shop}>
            <div className="mx-auto max-w-3xl">
                <Breadcrumbs
                    items={[
                        {
                            label: 'Home',
                            href: StorefrontController.index.url({
                                shop: shop.slug,
                            }),
                        },
                        { label: 'Order Confirmation' },
                    ]}
                />

                {/* Success Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 mb-8 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            delay: 0.2,
                            type: 'spring',
                            stiffness: 200,
                        }}
                        className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-100 sm:h-20 sm:w-20 dark:bg-success-500/20"
                    >
                        <CheckCircle className="h-8 w-8 text-success-600 sm:h-10 sm:w-10 dark:text-success-400" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                        Order Confirmed!
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Thank you for your order. We'll send you a confirmation
                        email shortly.
                    </p>
                </motion.div>

                {/* Order Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800"
                >
                    <div className="border-b border-gray-100 p-4 sm:p-6 dark:border-navy-700">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                    Order Number
                                </p>
                                <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                                    {order.order_number}
                                </p>
                            </div>
                            <Badge color={getOrderStatusColor(order.status)} size="sm">
                                {getOrderStatusLabel(order.status)}
                            </Badge>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 sm:p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <Package className="h-4 w-4" />
                            Order Items
                        </h2>
                        <div className="space-y-3">
                            {order.items?.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-navy-700/50"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {getItemName(item)}
                                            </p>
                                            {isService(item) && (
                                                <Badge color="info" size="sm">
                                                    Service
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {getItemDetails(item)}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(item.total_amount)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-navy-700">
                            <div className="flex justify-between text-sm">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Subtotal
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {formatCurrency(order.subtotal)}
                                </p>
                            </div>
                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Tax
                                    </p>
                                    <p className="text-gray-900 dark:text-white">
                                        {formatCurrency(order.tax_amount)}
                                    </p>
                                </div>
                            )}
                            {order.shipping_cost > 0 && (
                                <div className="flex justify-between text-sm">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Shipping
                                    </p>
                                    <p className="text-gray-900 dark:text-white">
                                        {formatCurrency(order.shipping_cost)}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold dark:border-navy-700">
                                <p className="text-gray-900 dark:text-white">
                                    Total
                                </p>
                                <p className="text-brand-600 dark:text-brand-400">
                                    {formatCurrency(order.total_amount)}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Info Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                    {/* Shipping Address */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-navy-700 dark:bg-navy-800">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <Truck className="h-4 w-4 text-brand-500" />
                            Shipping Address
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {shippingAddress.first_name}{' '}
                                {shippingAddress.last_name}
                            </p>
                            <p>{shippingAddress.address_line_1}</p>
                            {shippingAddress.address_line_2 && (
                                <p>{shippingAddress.address_line_2}</p>
                            )}
                            <p>
                                {shippingAddress.city}, {shippingAddress.state}{' '}
                                {shippingAddress.postal_code}
                            </p>
                            <p>{shippingAddress.country}</p>
                            <p className="mt-2 text-gray-500">
                                {shippingAddress.phone}
                            </p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-navy-700 dark:bg-navy-800">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <Receipt className="h-4 w-4 text-brand-500" />
                            Payment
                        </h3>
                        <div className="text-sm">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {order.payment_method
                                    .replace('_', ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Status:
                                </span>
                                <Badge
                                    color={getPaymentStatusColor(order.payment_status)}
                                    size="sm"
                                >
                                    {getPaymentStatusLabel(order.payment_status)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex flex-col justify-center gap-3 sm:flex-row"
                >
                    <Link
                        href={CustomerPortalController.orders.url({
                            shop: shop.slug,
                        })}
                    >
                        <Button variant="outline" className="w-full sm:w-auto">
                            View All Orders
                        </Button>
                    </Link>
                    <Link
                        href={StorefrontController.index.url({
                            shop: shop.slug,
                        })}
                    >
                        <Button
                            variant="primary"
                            endIcon={<ArrowRight className="h-4 w-4" />}
                            className="w-full sm:w-auto"
                        >
                            Continue Shopping
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </StorefrontLayout>
    );
};

export default CheckoutSuccess;
