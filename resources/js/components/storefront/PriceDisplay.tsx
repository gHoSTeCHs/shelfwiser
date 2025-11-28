import { Shop } from '@/types/shop';
import React from 'react';

interface PriceDisplayProps {
    price: number;
    retailPrice?: number | null;
    shop: Shop;
    size?: 'sm' | 'md' | 'lg';
    showTaxLabel?: boolean;
    className?: string;
}

/**
 * Formatted price display component with currency symbol.
 * Handles retail vs wholesale pricing and tax inclusive/exclusive labeling.
 */
const PriceDisplay: React.FC<PriceDisplayProps> = ({
    price,
    retailPrice,
    shop,
    size = 'md',
    showTaxLabel = false,
    className = '',
}) => {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
    };

    const displayPrice = retailPrice || price;
    const hasRetailPrice = retailPrice && retailPrice !== price;

    const formatPrice = (amount: number) => {
        return `${shop.currency_symbol}${Number(amount).toFixed(shop.currency_decimals || 2)}`;
    };

    return (
        <div className={className}>
            <div className="flex items-baseline gap-2">
                <span
                    className={`font-bold text-gray-900 ${sizeClasses[size]}`}
                >
                    {formatPrice(displayPrice)}
                </span>

                {hasRetailPrice && (
                    <span className="text-sm text-gray-500 line-through">
                        {formatPrice(price)}
                    </span>
                )}
            </div>

            {showTaxLabel && shop.vat_enabled && (
                <p className="mt-1 text-xs text-gray-500">
                    {shop.vat_inclusive ? 'Inc.' : 'Excl.'} VAT ({shop.vat_rate}
                    %)
                </p>
            )}
        </div>
    );
};

export default PriceDisplay;
