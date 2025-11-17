import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountOrderDetailProps } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { ArrowLeft } from 'lucide-react';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';

/**
 * Detailed order view page for customers.
 * Shows complete order information including items, addresses, and status.
 */
const OrderDetail: React.FC<AccountOrderDetailProps> = ({ shop, order }) => {
    const shippingAddress = JSON.parse(order.shipping_address);
    const billingAddress = JSON.parse(order.billing_address);

    return (
        <StorefrontLayout shop={shop}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link href={CustomerPortalController.orders.url({ shop: shop.slug })}>
                        <Button variant="ghost" startIcon={<ArrowLeft />}>
                            Back to Orders
                        </Button>
                    </Link>
                </div>

                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Order {order.order_number}
                        </h1>
                        <p className="text-gray-600">
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
                        {order.tracking_number && (
                            <p className="text-sm text-gray-600 mt-2">
                                Tracking: <span className="font-mono">{order.tracking_number}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Order Items</h2>

                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start pb-4 border-b last:border-b-0">
                                        <div className="flex-1">
                                            <p className="font-semibold text-lg">
                                                {item.productVariant?.product?.name}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                SKU: {item.productVariant?.sku}
                                            </p>
                                            {item.packagingType && (
                                                <p className="text-sm text-gray-600">
                                                    Packaging: {item.packagingType.name}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600 mt-2">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-semibold">
                                                {shop.currency_symbol}{item.total_amount.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {shop.currency_symbol}{item.unit_price.toFixed(2)} each
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <h3 className="font-semibold mb-3">Shipping Address</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p className="font-medium text-gray-900">
                                        {shippingAddress.first_name} {shippingAddress.last_name}
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
                                    <p className="mt-2">{shippingAddress.phone}</p>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="font-semibold mb-3">Billing Address</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p className="font-medium text-gray-900">
                                        {billingAddress.first_name} {billingAddress.last_name}
                                    </p>
                                    <p>{billingAddress.address_line_1}</p>
                                    {billingAddress.address_line_2 && (
                                        <p>{billingAddress.address_line_2}</p>
                                    )}
                                    <p>
                                        {billingAddress.city}, {billingAddress.state}{' '}
                                        {billingAddress.postal_code}
                                    </p>
                                    <p>{billingAddress.country}</p>
                                </div>
                            </Card>
                        </div>

                        {order.customer_notes && (
                            <Card className="p-6">
                                <h3 className="font-semibold mb-3">Order Notes</h3>
                                <p className="text-sm text-gray-600">{order.customer_notes}</p>
                            </Card>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-20">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <p className="text-gray-600">Subtotal</p>
                                    <p className="font-medium">
                                        {shop.currency_symbol}{order.subtotal.toFixed(2)}
                                    </p>
                                </div>

                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <p className="text-gray-600">Tax</p>
                                        <p className="font-medium">
                                            {shop.currency_symbol}{order.tax_amount.toFixed(2)}
                                        </p>
                                    </div>
                                )}

                                {order.shipping_cost > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <p className="text-gray-600">Shipping</p>
                                        <p className="font-medium">
                                            {shop.currency_symbol}{order.shipping_cost.toFixed(2)}
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                                    <p>Total</p>
                                    <p>{shop.currency_symbol}{order.total_amount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                                    <p className="font-medium">
                                        {order.payment_method.replace('_', ' ').toUpperCase()}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                                    <Badge color={
                                        order.payment_status === 'paid' ? 'success' : 'warning'
                                    }>
                                        {order.payment_status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default OrderDetail;
