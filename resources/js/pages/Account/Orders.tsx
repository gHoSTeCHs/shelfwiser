import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountOrdersProps } from '@/types/storefront';
import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import {
    Package,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Eye,
} from 'lucide-react';

/**
 * Customer order history page with pagination.
 * Lists all orders with status, payment info, and totals.
 */
const Orders: React.FC<AccountOrdersProps> = ({ shop, orders }) => {
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePageChange = (page: number) => {
        window.location.href = `${CustomerPortalController.orders.url({ shop: shop.slug })}?page=${page}`;
    };

    return (
        <StorefrontLayout shop={shop}>
            <Head title={`Order History - ${shop.name}`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Order History
                    </h1>
                    <p className="mt-2 text-gray-600">
                        View and track all your orders
                    </p>
                </div>

                {/* Orders List */}
                {orders.data.length > 0 ? (
                    <Card>
                        <div className="divide-y divide-gray-200">
                            {orders.data.map((order) => (
                                <div
                                    key={order.id}
                                    className="p-6 hover:bg-gray-50 transition"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Order Info */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Order #{order.order_number}
                                                </h3>
                                                <Badge
                                                    color={getStatusColor(
                                                        order.status,
                                                    )}
                                                >
                                                    {order.status}
                                                </Badge>
                                                <Badge
                                                    color={getPaymentStatusColor(
                                                        order.payment_status,
                                                    )}
                                                >
                                                    {order.payment_status}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>
                                                    <span className="font-medium">
                                                        Placed on:
                                                    </span>{' '}
                                                    {formatDate(order.created_at)}
                                                </p>
                                                <p>
                                                    <span className="font-medium">
                                                        Items:
                                                    </span>{' '}
                                                    {order.items?.length || 0}
                                                </p>
                                                {order.tracking_number && (
                                                    <p>
                                                        <span className="font-medium">
                                                            Tracking:
                                                        </span>{' '}
                                                        {order.tracking_number}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Order Items Preview */}
                                            {order.items &&
                                                order.items.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            Items:
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {order.items
                                                                .slice(0, 3)
                                                                .map(
                                                                    (
                                                                        item,
                                                                        index,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
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
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                                                    +
                                                                    {order.items
                                                                        .length -
                                                                        3}{' '}
                                                                    more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        {/* Order Total & Actions */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                                            <div className="text-left sm:text-right">
                                                <p className="text-sm text-gray-500 mb-1">
                                                    Total
                                                </p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {shop.currency_symbol}
                                                    {order.total_amount.toLocaleString(
                                                        undefined,
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )}
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
                                                    endIcon={<Eye />}
                                                >
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex justify-center items-center space-x-4">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            handlePageChange(
                                                orders.current_page - 1,
                                            )
                                        }
                                        disabled={orders.current_page === 1}
                                        startIcon={<ChevronLeft />}
                                    >
                                        Previous
                                    </Button>

                                    <span className="text-sm text-gray-600">
                                        Page {orders.current_page} of{' '}
                                        {orders.last_page}
                                    </span>

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            handlePageChange(
                                                orders.current_page + 1,
                                            )
                                        }
                                        disabled={
                                            orders.current_page ===
                                            orders.last_page
                                        }
                                        endIcon={<ChevronRight />}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                ) : (
                    <EmptyState
                        icon={<Package />}
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
