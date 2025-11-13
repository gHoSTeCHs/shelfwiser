import StockMovementController from '@/actions/App/Http/Controllers/StockMovementController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import AppLayout from '@/layouts/AppLayout';
import { StockMovement } from '@/types/stockMovement';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownCircle,
    ArrowLeft,
    ArrowRightCircle,
    ArrowUpCircle,
    Building2,
    Calendar,
    ClipboardCheck,
    Hash,
    MapPin,
    Package,
    ShoppingCart,
    Tag,
    Trash2,
    Undo2,
    User,
    Wrench,
} from 'lucide-react';

interface Props {
    movement: StockMovement;
}

export default function Show({ movement }: Props) {
    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'purchase':
                return <ShoppingCart className="h-6 w-6 text-success-500" />;
            case 'sale':
                return <Package className="h-6 w-6 text-blue-500" />;
            case 'adjustment_in':
                return <ArrowUpCircle className="h-6 w-6 text-success-500" />;
            case 'adjustment_out':
                return <ArrowDownCircle className="h-6 w-6 text-warning-500" />;
            case 'transfer_in':
                return (
                    <ArrowRightCircle className="h-6 w-6 rotate-180 text-brand-500" />
                );
            case 'transfer_out':
                return <ArrowRightCircle className="h-6 w-6 text-brand-500" />;
            case 'return':
                return <Undo2 className="h-6 w-6 text-blue-500" />;
            case 'damage':
                return <Wrench className="h-6 w-6 text-warning-500" />;
            case 'loss':
                return <Trash2 className="h-6 w-6 text-error-500" />;
            case 'stock_take':
                return <ClipboardCheck className="h-6 w-6 text-purple-500" />;
            default:
                return <Package className="h-6 w-6 text-gray-500" />;
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

    const getMovementBadgeColor = (type: string): string => {
        const isIncrease = [
            'purchase',
            'adjustment_in',
            'transfer_in',
            'return',
        ].includes(type);
        return isIncrease ? 'success' : 'warning';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isTransfer = movement.type.includes('transfer');

    return (
        <AppLayout>
            <Head title={`Stock Movement #${movement.id}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href={StockMovementController.index.url()}
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Stock Movements
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                        {getMovementIcon(movement.type)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Stock Movement Details
                        </h1>
                        <div className="mt-1 flex items-center gap-3">
                            <Badge color={getMovementBadgeColor(movement.type)}>
                                {getMovementLabel(movement.type)}
                            </Badge>
                            {movement.reference_number && (
                                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                    {movement.reference_number}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card title="Movement Information">
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <Package className="mr-2 h-4 w-4" />
                                            Product
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                            {movement.product_variant?.product?.name ||
                                                'N/A'}
                                        </p>
                                        {movement.product_variant?.name && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {movement.product_variant.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <Tag className="mr-2 h-4 w-4" />
                                            SKU
                                        </p>
                                        <p className="mt-1 font-mono text-gray-900 dark:text-white">
                                            {movement.product_variant?.sku || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <Hash className="mr-2 h-4 w-4" />
                                            Quantity
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                            {movement.quantity}
                                        </p>
                                    </div>

                                    {movement.quantity_before !== null && (
                                        <>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Quantity Before
                                                </p>
                                                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                    {movement.quantity_before}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Quantity After
                                                </p>
                                                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                    {movement.quantity_after}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {isTransfer && (
                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <p className="mb-3 flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Location Transfer
                                        </p>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    From
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                                    {movement.from_location?.location
                                                        ?.name || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    To
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                                    {movement.to_location?.location
                                                        ?.name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isTransfer && movement.to_location && (
                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Location
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                            {movement.to_location.location?.name ||
                                                'N/A'}
                                        </p>
                                    </div>
                                )}

                                {movement.reason && (
                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Reason
                                        </p>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {movement.reason}
                                        </p>
                                    </div>
                                )}

                                {movement.notes && (
                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Notes
                                        </p>
                                        <p className="mt-1 text-gray-700 dark:text-gray-300">
                                            {movement.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Details">
                            <div className="space-y-4">
                                {movement.reference_number && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Reference Number
                                        </p>
                                        <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                                            {movement.reference_number}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                        <User className="mr-2 h-4 w-4" />
                                        Created By
                                    </p>
                                    <p className="mt-1 text-gray-900 dark:text-white">
                                        {movement.created_by_user?.name || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Date & Time
                                    </p>
                                    <p className="mt-1 text-gray-900 dark:text-white">
                                        {formatDate(movement.created_at)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {movement.product_variant && (
                            <Card title="Quick Actions">
                                <div className="space-y-2">
                                    <Link
                                        href={StockMovementController.history.url({
                                            variant: movement.product_variant_id,
                                        })}
                                    >
                                        <Button variant="outline" className="w-full">
                                            View Product History
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
