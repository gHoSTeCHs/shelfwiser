import useCurrency from '@/hooks/useCurrency';
import { Shop } from '@/types/shop';
import { CartSummary } from '@/types/storefront';
import React from 'react';

interface OrderSummaryProps {
    summary: CartSummary;
    shop: Shop;
    title?: string;
    showItems?: boolean;
    className?: string;
}

/**
 * Reusable order/cart summary component showing price breakdown.
 * Displays subtotal, tax, shipping, and total with currency formatting.
 */
const OrderSummary: React.FC<OrderSummaryProps> = ({
    summary,
    shop,
    title = 'Order Summary',
    showItems = false,
    className = '',
}) => {
    const { formatCurrency } = useCurrency(shop);

    return (
        <div className={className}>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {title}
            </h3>

            <div className="space-y-3">
                {showItems && summary.items.length > 0 && (
                    <div className="space-y-2 border-b pb-3">
                        {summary.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between text-sm"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {item.productVariant?.product?.name}
                                    </p>
                                    <p className="text-gray-600">
                                        Qty: {item.quantity}
                                    </p>
                                </div>
                                <p className="font-medium text-gray-900">
                                    {formatCurrency(item.subtotal || 0)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <p className="text-gray-600">Subtotal</p>
                        <p className="font-medium text-gray-900">
                            {formatCurrency(summary.subtotal)}
                        </p>
                    </div>

                    {summary.tax > 0 && (
                        <div className="flex justify-between text-sm">
                            <p className="text-gray-600">
                                Tax {shop.vat_enabled && `(${shop.vat_rate}%)`}
                            </p>
                            <p className="font-medium text-gray-900">
                                {formatCurrency(summary.tax)}
                            </p>
                        </div>
                    )}

                    {summary.shipping_fee > 0 && (
                        <div className="flex justify-between text-sm">
                            <p className="text-gray-600">Shipping</p>
                            <p className="font-medium text-gray-900">
                                {formatCurrency(summary.shipping_fee)}
                            </p>
                        </div>
                    )}

                    {summary.shipping_fee === 0 && summary.item_count > 0 && (
                        <div className="flex justify-between text-sm">
                            <p className="text-gray-600">Shipping</p>
                            <p className="font-medium text-success-600">Free</p>
                        </div>
                    )}
                </div>

                <div className="border-t pt-3">
                    <div className="flex justify-between">
                        <p className="text-lg font-bold text-gray-900">Total</p>
                        <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(summary.total)}
                        </p>
                    </div>
                </div>

                {summary.item_count > 0 && (
                    <div className="pt-2 text-center text-sm text-gray-600">
                        {summary.item_count}{' '}
                        {summary.item_count === 1 ? 'item' : 'items'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderSummary;
