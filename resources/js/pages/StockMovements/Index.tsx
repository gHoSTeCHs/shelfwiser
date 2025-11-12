import StockMovementController from '@/actions/App/Http/Controllers/StockMovementController';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import  Pagination  from '@/components/ui/pagination/Pagination';
import AppLayout from '@/layouts/AppLayout';
import { StockMovement } from '@/types/stockMovement';
import { Head, Link } from '@inertiajs/react';
import {

    ArrowDownCircle,
    ArrowRightCircle,
    ArrowUpCircle,
    ClipboardCheck,
    Eye,
    Package,
    Search,
    ShoppingCart,
    Trash2,
    Undo2,
    Wrench,
} from 'lucide-react';
import { useState } from 'react';

interface PaginatedMovements {
    data: StockMovement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    movements: PaginatedMovements;
    movementTypes: Record<string, string>;
}

export default function Index({ movements, movementTypes }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');

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
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredMovements = movements.data.filter((movement) => {
        const matchesSearch =
            movement.reference_number
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            movement.product_variant?.product?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            movement.product_variant?.sku
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesType = !selectedType || movement.type === selectedType;

        return matchesSearch && matchesType;
    });

    const stats = {
        total: movements.total,
        today: movements.data.filter(
            (m) =>
                new Date(m.created_at).toDateString() ===
                new Date().toDateString()
        ).length,
        thisWeek: movements.data.filter((m) => {
            const date = new Date(m.created_at);
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
        }).length,
    };

    return (
        <AppLayout>
            <Head title="Stock Movements" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Stock Movements
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Complete audit trail of all inventory changes
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                                <Package className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Movements
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                                <ClipboardCheck className="h-6 w-6 text-success-600 dark:text-success-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Today
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.today}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                                <ArrowUpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This Week
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.thisWeek}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by reference, product, or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="sm:w-48">
                        <Select
                            options={[
                                { value: '', label: 'All Types' },
                                ...Object.entries(movementTypes).map(([value, label]) => ({
                                    value,
                                    label: label as string,
                                })),
                            ]}
                            onChange={(value) => setSelectedType(value)}
                            defaultValue={selectedType}
                            placeholder="All Types"
                        />
                    </div>
                </div>

                {filteredMovements.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No stock movements found"
                        description={
                            searchTerm || selectedType
                                ? 'Try adjusting your search criteria'
                                : 'Stock movements will appear here as inventory changes occur'
                        }
                    />
                ) : (
                    <>
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Date & Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Product
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Quantity
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Reference
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Created By
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredMovements.map((movement) => (
                                            <tr
                                                key={movement.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                                                    {formatDate(movement.created_at)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getMovementIcon(movement.type)}
                                                        <Badge
                                                            color={getMovementBadgeColor(
                                                                movement.type
                                                            )}
                                                        >
                                                            {getMovementLabel(movement.type)}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                                    {movement.product_variant?.product
                                                        ?.name || 'N/A'}
                                                    {movement.product_variant?.name && (
                                                        <div className="text-xs text-gray-500">
                                                            {movement.product_variant.name}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        SKU:{' '}
                                                        {movement.product_variant?.sku || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                                                    {movement.quantity}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                                                    {movement.reference_number || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {movement.created_by_user?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Link
                                                        href={StockMovementController.show.url({
                                                            stockMovement: movement.id,
                                                        })}
                                                    >
                                                        <button className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {movements.last_page > 1 && (
                            <Pagination
                                currentPage={movements.current_page}
                                lastPage={movements.last_page}
                                perPage={movements.per_page}
                                total={movements.total}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
