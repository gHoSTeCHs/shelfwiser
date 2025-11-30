import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountOrdersProps } from '@/types/storefront';
import { Link, router } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

/**
 * Customer order history page with pagination.
 * Displays all orders placed by the customer.
 */
const Orders: React.FC<AccountOrdersProps> = ({ shop, orders }) => {
    const handlePageChange = (page: number) => {
        router.get(
            CustomerPortalController.orders.url({ shop: shop.slug }),
            { page },
            { preserveState: true, preserveScroll: true }
        );
    };

    return (
        <StorefrontLayout shop={shop}>
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

                {orders.data.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                No orders yet
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Start shopping to see your orders here
                            </p>
                            <Link href={StorefrontController.products.url({ shop: shop.slug })}>
                                <Button variant="primary">
                                    Browse Products
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-4 mb-8">
                            {orders.data.map((order) => (
                                <Card key={order.id} className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <Link
                                                href={CustomerPortalController.orderDetail.url({
                                                    shop: shop.slug,
                                                    order: order.id
                                                })}
                                                className="text-xl font-semibold text-brand-600 hover:text-brand-700"
                                            >
                                                {order.order_number}
                                            </Link>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge color={
                                                order.status === 'delivered' ? 'success' :
                                                order.status === 'cancelled' ? 'error' :
                                                order.status === 'shipped' ? 'info' :
                                                order.status === 'processing' ? 'warning' :
                                                'light'
                                            }>
                                                {order.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                            <p className="text-sm text-gray-600 mt-2">
                                                Payment: <Badge color={
                                                    order.payment_status === 'paid' ? 'success' : 'warning'
                                                } size="sm">
                                                    {order.payment_status.toUpperCase()}
                                                </Badge>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="space-y-2 mb-4">
                                            {order.items?.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex justify-between text-sm">
                                                    <div>
                                                        <p className="font-medium">
                                                            {item.productVariant?.product?.name}
                                                        </p>
                                                        <p className="text-gray-600">
                                                            Qty: {item.quantity} × {shop.currency_symbol}{item.unit_price.toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <p className="font-medium">
                                                        {shop.currency_symbol}{item.total_amount.toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                            {order.items && order.items.length > 3 && (
                                                <p className="text-sm text-gray-600">
                                                    + {order.items.length - 3} more item(s)
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t">
                                            <div className="text-lg font-bold">
                                                Total: {shop.currency_symbol}{order.total_amount.toFixed(2)}
                                            </div>
                                            <Link
                                                href={CustomerPortalController.orderDetail.url({
                                                    shop: shop.slug,
                                                    order: order.id
                                                })}
                                            >
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {orders.last_page > 1 && (
                            <div className="flex justify-center items-center space-x-4">
                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(orders.current_page - 1)}
                                    disabled={orders.current_page === 1}
                                    startIcon={<ChevronLeft />}
                                >
                                    Previous
                                </Button>

                                <span className="text-sm text-gray-600">
                                    Page {orders.current_page} of {orders.last_page}
                                </span>

                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(orders.current_page + 1)}
                                    disabled={orders.current_page === orders.last_page}
                                    endIcon={<ChevronRight />}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </StorefrontLayout>
    );
};

export default Orders;
