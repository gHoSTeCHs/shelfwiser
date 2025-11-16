import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountOrderDetailProps } from '@/types/storefront';
import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import {
    ArrowLeft,
    Package,
    MapPin,
    CreditCard,
    Calendar,
    Truck,
} from 'lucide-react';

/**
 * Customer order detail page.
 * Shows complete order information including items, addresses, and tracking.
 */
const OrderDetail: React.FC<AccountOrderDetailProps> = ({ shop, order }) => {
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <StorefrontLayout shop={shop}>
            <Head title={`Order #${order.order_number} - ${shop.name}`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={CustomerPortalController.orders.url({
                            shop: shop.slug,
                        })}
                    >
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                    </Link>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Order #{order.order_number}
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Placed on {formatDate(order.created_at)}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge
                                color={getStatusColor(order.status)}
                                size="md"
                            >
                                {order.status}
                            </Badge>
                            <Badge
                                color={getPaymentStatusColor(
                                    order.payment_status,
                                )}
                                size="md"
                            >
                                {order.payment_status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card title="Order Items">
                            <div className="divide-y divide-gray-200">
                                {order.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex gap-4">
                                            {/* Product Image Placeholder */}
                                            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Package className="h-8 w-8 text-gray-400" />
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900">
                                                    {item.productVariant
                                                        ?.product?.name ||
                                                        'Product'}
                                                </h4>
                                                {item.productVariant?.sku && (
                                                    <p className="text-sm text-gray-500">
                                                        SKU:{' '}
                                                        {
                                                            item.productVariant
                                                                .sku
                                                        }
                                                    </p>
                                                )}
                                                {item.packagingType && (
                                                    <p className="text-sm text-gray-500">
                                                        Packaging:{' '}
                                                        {item.packagingType.name}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-sm text-gray-600">
                                                    Quantity: {item.quantity}
                                                </p>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    {shop.currency_symbol}
                                                    {item.unit_price.toLocaleString(
                                                        undefined,
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )}
                                                </p>
                                                {item.quantity > 1 && (
                                                    <p className="text-sm text-gray-500">
                                                        Total:{' '}
                                                        {shop.currency_symbol}
                                                        {(
                                                            item.unit_price *
                                                            item.quantity
                                                        ).toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                            <Card title="Shipping Address">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                            {order.shipping_address}
                                        </pre>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Customer Notes */}
                        {order.customer_notes && (
                            <Card title="Order Notes">
                                <p className="text-sm text-gray-700">
                                    {order.customer_notes}
                                </p>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card title="Order Summary">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Subtotal
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {shop.currency_symbol}
                                        {order.subtotal.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            },
                                        )}
                                    </span>
                                </div>

                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Tax
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {shop.currency_symbol}
                                            {order.tax_amount.toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </span>
                                    </div>
                                )}

                                {order.shipping_cost > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Shipping
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {shop.currency_symbol}
                                            {order.shipping_cost.toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between">
                                        <span className="text-base font-semibold text-gray-900">
                                            Total
                                        </span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {shop.currency_symbol}
                                            {order.total_amount.toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Payment Information */}
                        <Card title="Payment Information">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        Payment Method
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                    {order.payment_method.replace('_', ' ')}
                                </p>
                            </div>
                        </Card>

                        {/* Tracking Information */}
                        {order.tracking_number && (
                            <Card title="Tracking Information">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            Tracking Number
                                        </span>
                                    </div>
                                    <p className="text-sm font-mono font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded">
                                        {order.tracking_number}
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card title="Order Timeline">
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Order Placed
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {order.updated_at !== order.created_at && (
                                    <div className="flex gap-3">
                                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Last Updated
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(order.updated_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default OrderDetail;
