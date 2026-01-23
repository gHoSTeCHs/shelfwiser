import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import useCurrency from '@/hooks/useCurrency';
import { formatDateTime } from '@/lib/formatters';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { getOrderStatusColor, getOrderStatusLabel, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/status-configs';
import { AccountOrderDetailProps } from '@/types/storefront';
import { Form, Link } from '@inertiajs/react';
import { ArrowLeft, XCircle } from 'lucide-react';
import React, { useState } from 'react';

/**
 * Detailed order view page for customers.
 * Shows complete order information including items, addresses, and status.
 */
const OrderDetail: React.FC<AccountOrderDetailProps> = ({ shop, order }) => {
    const { formatCurrency } = useCurrency(shop);
    const shippingAddress = JSON.parse(order.shipping_address);
    const billingAddress = JSON.parse(order.billing_address);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const canCancel =
        order.status === 'pending' || order.status === 'confirmed';

    return (
        <StorefrontLayout shop={shop}>
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <Link
                        href={CustomerPortalController.orders.url({
                            shop: shop.slug,
                        })}
                    >
                        <Button variant="ghost" startIcon={<ArrowLeft />}>
                            Back to Orders
                        </Button>
                    </Link>
                </div>

                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900">
                            Order {order.order_number}
                        </h1>
                        <p className="text-gray-600">
                            Placed on{' '}
                            {formatDateTime(order.created_at)}
                        </p>
                    </div>
                    <div className="space-y-2 text-right">
                        <div>
                            <Badge color={getOrderStatusColor(order.status)}>
                                {getOrderStatusLabel(order.status)}
                            </Badge>
                            {order.tracking_number && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Tracking:{' '}
                                    <span className="font-mono">
                                        {order.tracking_number}
                                    </span>
                                </p>
                            )}
                        </div>
                        {canCancel && (
                            <Button
                                variant="destructive"
                                size="sm"
                                startIcon={<XCircle className="h-4 w-4" />}
                                onClick={() => setShowCancelModal(true)}
                            >
                                Cancel Order
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="p-6">
                            <h2 className="mb-4 text-xl font-semibold">
                                Order Items
                            </h2>

                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start justify-between border-b pb-4 last:border-b-0"
                                    >
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold">
                                                {
                                                    item.product_variant?.product
                                                        ?.name
                                                }
                                            </p>
                                            <p className="mt-1 text-sm text-gray-600">
                                                SKU: {item.product_variant?.sku}
                                            </p>
                                            {item.packaging_type && (
                                                <p className="text-sm text-gray-600">
                                                    Packaging:{' '}
                                                    {item.packaging_type.name}
                                                </p>
                                            )}
                                            <p className="mt-2 text-sm text-gray-600">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <p className="font-semibold">
                                                {formatCurrency(item.total_amount)}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {formatCurrency(item.unit_price)} each
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Card className="p-6">
                                <h3 className="mb-3 font-semibold">
                                    Shipping Address
                                </h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p className="font-medium text-gray-900">
                                        {shippingAddress.first_name}{' '}
                                        {shippingAddress.last_name}
                                    </p>
                                    <p>{shippingAddress.address_line_1}</p>
                                    {shippingAddress.address_line_2 && (
                                        <p>{shippingAddress.address_line_2}</p>
                                    )}
                                    <p>
                                        {shippingAddress.city},{' '}
                                        {shippingAddress.state}{' '}
                                        {shippingAddress.postal_code}
                                    </p>
                                    <p>{shippingAddress.country}</p>
                                    <p className="mt-2">
                                        {shippingAddress.phone}
                                    </p>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="mb-3 font-semibold">
                                    Billing Address
                                </h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p className="font-medium text-gray-900">
                                        {billingAddress.first_name}{' '}
                                        {billingAddress.last_name}
                                    </p>
                                    <p>{billingAddress.address_line_1}</p>
                                    {billingAddress.address_line_2 && (
                                        <p>{billingAddress.address_line_2}</p>
                                    )}
                                    <p>
                                        {billingAddress.city},{' '}
                                        {billingAddress.state}{' '}
                                        {billingAddress.postal_code}
                                    </p>
                                    <p>{billingAddress.country}</p>
                                </div>
                            </Card>
                        </div>

                        {order.customer_notes && (
                            <Card className="p-6">
                                <h3 className="mb-3 font-semibold">
                                    Order Notes
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {order.customer_notes}
                                </p>
                            </Card>
                        )}

                        {order.cancellation_reason &&
                            order.status === 'cancelled' && (
                                <Card className="border-error-200 bg-error-50 p-6">
                                    <h3 className="mb-3 font-semibold text-error-900">
                                        Cancellation Reason
                                    </h3>
                                    <p className="text-sm text-error-700">
                                        {order.cancellation_reason}
                                    </p>
                                    {order.cancelled_at && (
                                        <p className="mt-2 text-xs text-error-600">
                                            Cancelled on{' '}
                                            {formatDateTime(order.cancelled_at)}
                                        </p>
                                    )}
                                </Card>
                            )}
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-20 p-6">
                            <h2 className="mb-4 text-xl font-semibold">
                                Order Summary
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <p className="text-gray-600">Subtotal</p>
                                    <p className="font-medium">
                                        {formatCurrency(order.subtotal)}
                                    </p>
                                </div>

                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <p className="text-gray-600">Tax</p>
                                        <p className="font-medium">
                                            {formatCurrency(order.tax_amount)}
                                        </p>
                                    </div>
                                )}

                                {order.shipping_cost > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <p className="text-gray-600">
                                            Shipping
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(order.shipping_cost)}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                                    <p>Total</p>
                                    <p>{formatCurrency(order.total_amount)}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3 border-t pt-6">
                                <div>
                                    <p className="mb-1 text-sm text-gray-600">
                                        Payment Method
                                    </p>
                                    <p className="font-medium">
                                        {order.payment_method
                                            .replace('_', ' ')
                                            .toUpperCase()}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-1 text-sm text-gray-600">
                                        Payment Status
                                    </p>
                                    <Badge color={getPaymentStatusColor(order.payment_status)}>
                                        {getPaymentStatusLabel(order.payment_status)}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <Modal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    title="Cancel Order"
                    description="Please provide a reason for cancelling this order. This action cannot be undone."
                >
                    <Form
                        action={CustomerPortalController.cancelOrder.url({
                            shop: shop.slug,
                            order: order.id,
                        })}
                        method="post"
                    >
                        {({ errors, processing }) => (
                            <div className="space-y-4 p-6">
                                <div>
                                    <Label htmlFor="cancellation_reason">
                                        Cancellation Reason
                                    </Label>
                                    <textarea
                                        id="cancellation_reason"
                                        name="cancellation_reason"
                                        rows={4}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                        placeholder="Please tell us why you're cancelling this order..."
                                        required
                                        minLength={10}
                                        maxLength={500}
                                    />
                                    <InputError
                                        message={errors.cancellation_reason}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Minimum 10 characters
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCancelModal(false)}
                                        disabled={processing}
                                    >
                                        Keep Order
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        loading={processing}
                                        disabled={processing}
                                    >
                                        Cancel Order
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </Modal>
            </div>
        </StorefrontLayout>
    );
};

export default OrderDetail;
