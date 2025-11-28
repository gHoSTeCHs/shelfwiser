import StorefrontLayout from '@/layouts/StorefrontLayout';
import { CheckoutSuccessProps } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import { CheckCircle } from 'lucide-react';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';

/**
 * Order confirmation page displayed after successful checkout.
 * Shows order details and next steps.
 */
const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({ shop, order }) => {
    const shippingAddress = JSON.parse(order.shipping_address);

    const isProduct = (item: any) => {
        return item.sellable_type === 'App\\Models\\ProductVariant' || item.product_variant_id;
    };

    const isService = (item: any) => {
        return item.sellable_type === 'App\\Models\\ServiceVariant';
    };

    const getItemName = (item: any) => {
        if (isProduct(item)) {
            return item.productVariant?.product?.name || 'Product';
        } else if (isService(item)) {
            return item.sellable?.service?.name || 'Service';
        }
        return 'Item';
    };

    const getItemDetails = (item: any) => {
        if (isProduct(item)) {
            return `${item.productVariant?.sku} × ${item.quantity}`;
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
            <div className="max-w-3xl mx-auto">
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: StorefrontController.index.url({ shop: shop.slug }) },
                        { label: 'Order Confirmation' },
                    ]}
                />

                <div className="text-center mb-8 mt-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                        <CheckCircle className="w-10 h-10 text-success-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Confirmed!</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Thank you for your order. We'll send you a confirmation email shortly.
                    </p>
                </div>

                <Card className="p-6 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{order.order_number}</p>
                        </div>
                        <Badge color="primary">
                            {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
                        <div className="space-y-3">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {getItemName(item)}
                                            </p>
                                            {isService(item) && (
                                                <Badge color="info" size="sm">Service</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {getItemDetails(item)}
                                        </p>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {shop.currency_symbol}{item.total_amount.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t mt-6 pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <p>Subtotal</p>
                                <p>{shop.currency_symbol}{order.subtotal.toFixed(2)}</p>
                            </div>

                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <p>Tax</p>
                                    <p>{shop.currency_symbol}{order.tax_amount.toFixed(2)}</p>
                                </div>
                            )}

                            {order.shipping_cost > 0 && (
                                <div className="flex justify-between text-sm">
                                    <p>Shipping</p>
                                    <p>{shop.currency_symbol}{order.shipping_cost.toFixed(2)}</p>
                                </div>
                            )}

                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                <p>Total</p>
                                <p>{shop.currency_symbol}{order.total_amount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-3">Shipping Address</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>{shippingAddress.first_name} {shippingAddress.last_name}</p>
                            <p>{shippingAddress.address_line_1}</p>
                            {shippingAddress.address_line_2 && (
                                <p>{shippingAddress.address_line_2}</p>
                            )}
                            <p>
                                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                            </p>
                            <p>{shippingAddress.country}</p>
                            <p className="mt-2">{shippingAddress.phone}</p>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold mb-3">Payment Method</h3>
                        <div className="text-sm text-gray-600">
                            <p className="font-medium">
                                {order.payment_method.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="mt-2">
                                Status: <Badge color="warning" size="sm">
                                    {order.payment_status.toUpperCase()}
                                </Badge>
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href={CustomerPortalController.orders.url({ shop: shop.slug })}>
                        <Button variant="outline">
                            View All Orders
                        </Button>
                    </Link>
                    <Link href={StorefrontController.index.url({ shop: shop.slug })}>
                        <Button variant="primary">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default CheckoutSuccess;
