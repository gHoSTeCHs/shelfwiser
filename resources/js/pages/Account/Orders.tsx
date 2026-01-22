import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import useCurrency from '@/hooks/useCurrency';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { formatDateShort } from '@/lib/formatters';
import { getOrderStatusColor, getPaymentStatusColor } from '@/lib/status-configs';
import { AccountOrdersProps } from '@/types/storefront';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Package } from 'lucide-react';
import React from 'react';

/**
 * Customer order history page with playful-luxury styling.
 */
const Orders: React.FC<AccountOrdersProps> = ({ shop, orders }) => {
    const { formatCurrency } = useCurrency(shop);

    const handlePageChange = (page: number) => {
        window.location.href = `${CustomerPortalController.orders.url({ shop: shop.slug })}?page=${page}`;
    };

    return (
        <StorefrontLayout shop={shop}>
            <Head title={`Order History - ${shop.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                        Order History
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        View and track all your orders
                    </p>
                </motion.div>

                {/* Orders List */}
                {orders.data.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800"
                    >
                        <div className="divide-y divide-gray-100 dark:divide-navy-700">
                            {orders.data.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.05 * index }}
                                    className="p-4 transition hover:bg-gray-50 sm:p-6 dark:hover:bg-navy-700/50"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        {/* Order Info */}
                                        <div className="flex-1">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                                                    Order #{order.order_number}
                                                </h3>
                                                <Badge
                                                    color={getOrderStatusColor(
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

                                            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                                <p>
                                                    {formatDateShort(
                                                        order.created_at,
                                                    )}
                                                </p>
                                                <p>
                                                    {order.items?.length || 0}{' '}
                                                    items
                                                </p>
                                            </div>

                                            {/* Items Preview */}
                                            {order.items &&
                                                order.items.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {order.items
                                                            .slice(0, 3)
                                                            .map(
                                                                (item, idx) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-navy-700 dark:text-gray-300"
                                                                    >
                                                                        {item
                                                                            .productVariant
                                                                            ?.product
                                                                            ?.name ||
                                                                            'Product'}{' '}
                                                                        ×
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        {order.items.length >
                                                            3 && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-navy-700 dark:text-gray-300">
                                                                +
                                                                {order.items
                                                                    .length -
                                                                    3}{' '}
                                                                more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                        </div>

                                        {/* Total & Actions */}
                                        <div className="flex flex-row items-center gap-4 sm:gap-6">
                                            <div className="text-left sm:text-right">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Total
                                                </p>
                                                <p className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                                                    {formatCurrency(order.total_amount)}
                                                </p>
                                            </div>

                                            <Link
                                                href={CustomerPortalController.orderDetail.url(
                                                    {
                                                        shop: shop.slug,
                                                        order: order.id,
                                                    },
                                                )}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    endIcon={
                                                        <Eye className="h-4 w-4" />
                                                    }
                                                >
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="border-t border-gray-100 px-4 py-4 sm:px-6 dark:border-navy-700">
                                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handlePageChange(
                                                orders.current_page - 1,
                                            )
                                        }
                                        disabled={orders.current_page === 1}
                                        startIcon={
                                            <ChevronLeft className="h-4 w-4" />
                                        }
                                    >
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from(
                                            {
                                                length: Math.min(
                                                    5,
                                                    orders.last_page,
                                                ),
                                            },
                                            (_, i) => {
                                                let page: number;
                                                if (orders.last_page <= 5) {
                                                    page = i + 1;
                                                } else if (
                                                    orders.current_page <= 3
                                                ) {
                                                    page = i + 1;
                                                } else if (
                                                    orders.current_page >=
                                                    orders.last_page - 2
                                                ) {
                                                    page =
                                                        orders.last_page -
                                                        4 +
                                                        i;
                                                } else {
                                                    page =
                                                        orders.current_page -
                                                        2 +
                                                        i;
                                                }
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() =>
                                                            handlePageChange(
                                                                page,
                                                            )
                                                        }
                                                        className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                                                            page ===
                                                            orders.current_page
                                                                ? 'bg-brand-500 text-white'
                                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-700'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handlePageChange(
                                                orders.current_page + 1,
                                            )
                                        }
                                        disabled={
                                            orders.current_page ===
                                            orders.last_page
                                        }
                                        endIcon={
                                            <ChevronRight className="h-4 w-4" />
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No orders yet"
                        description="You haven't placed any orders. Start shopping to see your order history here."
                        action={
                            <Link href={`/store/${shop.slug}/products`}>
                                <Button variant="primary">
                                    Browse Products
                                </Button>
                            </Link>
                        }
                    />
                )}
            </div>
        </StorefrontLayout>
    );
};

export default Orders;
