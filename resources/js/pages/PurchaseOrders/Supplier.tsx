import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import {
    purchaseOrderPaymentStatusConfig,
    purchaseOrderStatusConfig,
} from '@/lib/status-configs';
import {
    PurchaseOrderListResponse,
    PurchaseOrderStatus,
} from '@/types/supplier';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    DollarSign,
    FileText,
    Package,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    purchaseOrders: PurchaseOrderListResponse;
}

export default function Supplier({ purchaseOrders }: Props) {
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredOrders =
        statusFilter === 'all'
            ? purchaseOrders.data
            : purchaseOrders.data.filter((po) => po.status === statusFilter);

    const pendingApprovalCount = purchaseOrders.data.filter(
        (po) => po.status === 'submitted',
    ).length;

    const activeOrdersCount = purchaseOrders.data.filter((po) =>
        ['approved', 'processing'].includes(po.status),
    ).length;

    return (
        <>
            <Head title="Supplier Orders" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Supplier Orders
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage purchase orders from your buyers
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/20">
                                <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Pending Approval
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {pendingApprovalCount}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Active Orders
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {activeOrdersCount}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Orders
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {purchaseOrders.data.length}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            All Orders
                        </button>
                        <button
                            onClick={() => setStatusFilter('submitted')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'submitted'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            Pending Approval ({pendingApprovalCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('approved')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'approved'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            Approved
                        </button>
                        <button
                            onClick={() => setStatusFilter('processing')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'processing'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            Processing
                        </button>
                        <button
                            onClick={() => setStatusFilter('shipped')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'shipped'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            Shipped
                        </button>
                    </div>
                </Card>

                {filteredOrders.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="h-12 w-12" />}
                        title={
                            statusFilter === 'all'
                                ? 'No purchase orders'
                                : `No ${purchaseOrderStatusConfig[statusFilter as PurchaseOrderStatus]?.label.toLowerCase() || statusFilter} orders`
                        }
                        description={
                            statusFilter === 'all'
                                ? 'No buyers have placed orders yet'
                                : 'Try adjusting your filter'
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((po) => (
                            <Card key={po.id} className="overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={PurchaseOrderController.show(
                                                        {
                                                            id: po.id,
                                                        },
                                                    )}
                                                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                                                >
                                                    {po.po_number}
                                                </Link>
                                                <Badge
                                                    color={
                                                        purchaseOrderStatusConfig[po.status]
                                                            ?.color ?? 'gray'
                                                    }
                                                >
                                                    {
                                                        purchaseOrderStatusConfig[po.status]
                                                            ?.label ?? po.status
                                                    }
                                                </Badge>
                                                <Badge
                                                    color={
                                                        purchaseOrderPaymentStatusConfig[
                                                            po.payment_status
                                                        ]?.color ?? 'gray'
                                                    }
                                                    size="sm"
                                                >
                                                    {
                                                        purchaseOrderPaymentStatusConfig[
                                                            po.payment_status
                                                        ]?.label ?? po.payment_status
                                                    }
                                                </Badge>
                                            </div>

                                            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Building2 className="h-4 w-4" />
                                                    <span>
                                                        <span className="font-medium">
                                                            Buyer:
                                                        </span>{' '}
                                                        {po.buyer_tenant?.name}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Package className="h-4 w-4" />
                                                    <span>
                                                        <span className="font-medium">
                                                            Deliver to:
                                                        </span>{' '}
                                                        {po.shop?.name}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>
                                                        <span className="font-medium">
                                                            Total:
                                                        </span>{' '}
                                                        {formatCurrency(po.total_amount, 'USD')}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {formatDateShort(po.created_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            {po.expected_delivery_date && (
                                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                    Expected delivery:{' '}
                                                    {formatDateShort(po.expected_delivery_date)}
                                                </p>
                                            )}

                                            {po.status === 'submitted' && (
                                                <div className="mt-3">
                                                    <Badge
                                                        color="warning"
                                                        size="sm"
                                                    >
                                                        Action Required: Review
                                                        and approve this order
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <Link
                                            href={PurchaseOrderController.show({
                                                id: po.id,
                                            })}
                                        >
                                            <Button variant="outline" size="sm">
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Supplier.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
