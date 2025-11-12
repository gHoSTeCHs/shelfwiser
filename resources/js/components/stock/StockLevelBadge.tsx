import Badge from '@/components/ui/badge/Badge';
import { AlertCircle, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface Props {
    totalStock: number;
    availableStock: number;
    lowStockThreshold?: number;
    outOfStockThreshold?: number;
    showIcon?: boolean;
    size?: 'sm' | 'md';
}

export default function StockLevelBadge({
    availableStock,
    lowStockThreshold = 10,
    outOfStockThreshold = 0,
    showIcon = true,
    size = 'md',
}: Props) {
    const getStockStatus = () => {
        if (availableStock <= outOfStockThreshold) {
            return {
                label: 'Out of Stock',
                color: 'error' as const,
                icon: <AlertCircle className={getIconSize()} />,
            };
        }

        if (availableStock <= lowStockThreshold) {
            return {
                label: `Low Stock (${availableStock})`,
                color: 'warning' as const,
                icon: <AlertTriangle className={getIconSize()} />,
            };
        }

        return {
            label: `In Stock (${availableStock})`,
            color: 'success' as const,
            icon: <CheckCircle className={getIconSize()} />,
        };
    };

    const getIconSize = () => {
        switch (size) {
            case 'sm':
                return 'h-3 w-3';
            default:
                return 'h-4 w-4';
        }
    };

    const status = getStockStatus();

    return (
        <Badge
            variant="light"
            size={size}
            color={status.color}
            startIcon={showIcon ? status.icon : undefined}
        >
            {status.label}
        </Badge>
    );
}

interface StockLevelIndicatorProps {
    totalStock: number;
    availableStock: number;
    reservedStock?: number;
    lowStockThreshold?: number;
    showDetails?: boolean;
    className?: string;
}

export function StockLevelIndicator({
    totalStock,
    availableStock,
    reservedStock = 0,
    lowStockThreshold = 10,
    showDetails = true,
    className = '',
}: StockLevelIndicatorProps) {
    const stockPercentage =
        totalStock > 0 ? (availableStock / totalStock) * 100 : 0;

    const getBarColor = () => {
        if (availableStock === 0) return 'bg-error-500';
        if (availableStock <= lowStockThreshold) return 'bg-warning-500';
        return 'bg-success-500';
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {showDetails && (
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Package className="h-4 w-4" />
                        <span className="font-medium">Stock Level</span>
                    </div>
                    <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                            {availableStock} available
                        </div>
                        {reservedStock > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {reservedStock} reserved
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                    className={`h-full transition-all duration-300 ${getBarColor()}`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
            </div>

            {showDetails && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                        {availableStock === 0
                            ? 'Out of stock'
                            : availableStock <= lowStockThreshold
                              ? 'Low stock'
                              : 'In stock'}
                    </span>
                    <span>Total: {totalStock}</span>
                </div>
            )}
        </div>
    );
}
