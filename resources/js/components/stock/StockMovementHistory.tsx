import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import { StockMovement } from '@/types/stockMovement';
import {
    ArrowDownCircle,
    ArrowRightCircle,
    ArrowUpCircle,
    ClipboardCheck,
    Package,
    ShoppingCart,
    Trash2,
    Undo2,
    Wrench,
} from 'lucide-react';

interface Props {
    movements: StockMovement[];
    showVariantInfo?: boolean;
}

export default function StockMovementHistory({
                                                 movements,
                                                 showVariantInfo = false,
                                             }: Props) {
    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'purchase':
                return <ShoppingCart className="h-5 w-5 text-success-500" />;
            case 'sale':
                return <Package className="h-5 w-5 text-blue-500" />;
            case 'adjustment_in':
                return <ArrowUpCircle className="h-5 w-5 text-success-500" />;
            case 'adjustment_out':
                return <ArrowDownCircle className="h-5 w-5 text-warning-500" />;
            case 'transfer_in':
                return (
                    <ArrowRightCircle className="h-5 w-5 rotate-180 text-brand-500" />
                );
            case 'transfer_out':
                return <ArrowRightCircle className="h-5 w-5 text-brand-500" />;
            case 'return':
                return <Undo2 className="h-5 w-5 text-blue-500" />;
            case 'damage':
                return <Wrench className="h-5 w-5 text-warning-500" />;
            case 'loss':
                return <Trash2 className="h-5 w-5 text-error-500" />;
            case 'stock_take':
                return <ClipboardCheck className="h-5 w-5 text-purple-500" />;
            default:
                return <Package className="h-5 w-5 text-gray-500" />;
        }
    };

    const getMovementLabel = (type: string): string => {
        const labels: Record<string, string> = {
            purchase: 'Purchase',
            sale: 'Sale',
            adjustment_in: 'Adjustment In',
            adjustment_out: 'Adjustment Out',
            transfer_in: 'Transfer In',
            transfer_out: 'Transfer Out',
            return: 'Return',
            damage: 'Damage',
            loss: 'Loss',
            stock_take: 'Stock Take',
        };
        return labels[type] || type;
    };

    const getMovementBadgeColor = (
        type: string
    ): 'success' | 'warning' | 'error' | 'info' | 'primary' => {
        const isIncrease = [
            'purchase',
            'adjustment_in',
            'transfer_in',
            'return',
        ].includes(type);

        if (type === 'loss' || type === 'damage') return 'error';
        if (type === 'stock_take') return 'info';

        return isIncrease ? 'success' : 'warning';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            {movements.length === 0 ? (
                <Card>
                    <div className="p-8 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                            No stock movements
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            No stock movement history available for this variant.
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Date & Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Type
                            </th>
                            {showVariantInfo && (
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Product
                                </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Location
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Quantity
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Before
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                After
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Reason
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Reference
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {movements.map((movement) => (
                            <tr
                                key={movement.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                                    {formatDate(movement.created_at)}
                                    {movement.created_by_user && (
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            by {movement.created_by_user.name}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        {getMovementIcon(movement.type)}
                                        <Badge
                                            variant="light"
                                            size="sm"
                                            color={getMovementBadgeColor(
                                                movement.type
                                            )}
                                        >
                                            {getMovementLabel(movement.type)}
                                        </Badge>
                                    </div>
                                </td>
                                {showVariantInfo && (
                                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                        {movement.product_variant?.product
                                            ?.name || 'N/A'}
                                        {movement.product_variant?.name && (
                                            <div className="text-xs text-gray-500">
                                                {movement.product_variant.name}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            SKU: {movement.product_variant?.sku}
                                        </div>
                                    </td>
                                )}
                                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                    {movement.type.includes('transfer') ? (
                                        <div className="space-y-1">
                                            <div>
                                                From:{' '}
                                                {movement.from_location?.locatable
                                                    ?.name || 'N/A'}
                                            </div>
                                            <div>
                                                To:{' '}
                                                {movement.to_location?.locatable
                                                    ?.name || 'N/A'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {movement.to_location?.locatable
                                                    ?.name ||
                                                movement.from_location?.locatable
                                                    ?.name ||
                                                'N/A'}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                                    {movement.quantity}
                                </td>
                                <td className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                    {movement.quantity_before ?? '-'}
                                </td>
                                <td className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                    {movement.quantity_after ?? '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {movement.reason || '-'}
                                    {movement.notes && (
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                            {movement.notes}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                                    {movement.reference_number || '-'}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
