import useCurrency from '@/hooks/useCurrency';
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
    const { formatCurrency } = useCurrency(shop);

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
    };

    const displayPrice = retailPrice || price;
    const hasRetailPrice = retailPrice && retailPrice !== price;

    return (
        <div className={className}>
            <div className="flex items-baseline gap-2">
                <span
                    className={`font-bold text-gray-900 dark:text-white ${sizeClasses[size]}`}
                >
                    {formatCurrency(displayPrice)}
                </span>

                {hasRetailPrice && (
                    <span className="text-sm text-gray-500 line-through dark:text-gray-400">
                        {formatCurrency(price)}
                    </span>
                )}
            </div>

            {showTaxLabel && shop.vat_enabled && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {shop.vat_inclusive ? 'Inc.' : 'Excl.'} VAT ({shop.vat_rate}
                    %)
                </p>
            )}
        </div>
    );
};

export default PriceDisplay;
