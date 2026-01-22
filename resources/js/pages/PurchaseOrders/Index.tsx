import {
    create,
    show,
} from '@/actions/App/Http/Controllers/PurchaseOrderController.ts';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { Shop } from '@/types/shop';
import { PurchaseOrderListResponse } from '@/types/supplier';
import { paymentStatusConfig, statusConfig } from '@/utils/purchase-order';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    DollarSign,
    FileText,
    Package,
    Plus,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    purchaseOrders: PurchaseOrderListResponse;
    shops: Shop[];
}

export default function Index({ purchaseOrders, shops }: Props) {
    const [selectedShop, setSelectedShop] = useState('');

    const filteredOrders = selectedShop
        ? purchaseOrders.data.filter(
              (po) => po.shop_id.toString() === selectedShop,
          )
        : purchaseOrders.data;

    return (
        <>
            <Head title="Purchase Orders" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Purchase Orders
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage orders from suppliers
                        </p>
                    </div>
                    <Link href={create()}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Purchase Order
                        </Button>
                    </Link>
                </div>

                {shops.length > 1 && (
                    <div className="sm:w-64">
                        <Select
                            options={[
                                { value: '', label: 'All Shops' },
                                ...shops.map((shop) => ({
                                    value: shop.id.toString(),
                                    label: shop.name,
                                })),
                            ]}
                            defaultValue={selectedShop}
                            onChange={setSelectedShop}
                            placeholder="Filter by shop"
                        />
                    </div>
                )}

                {filteredOrders.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="h-12 w-12" />}
                        title="No purchase orders"
                        description="Create your first purchase order to start ordering from suppliers"
                        action={
                            <Link href={create()}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Purchase Order
                                </Button>
                            </Link>
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
                                                    href={show(po.id)}
                                                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                                                >
                                                    {po.po_number}
                                                </Link>
                                                <Badge
                                                    variant={'light'}
                                                    color={
                                                        statusConfig[po.status]
                                                            .color
                                                    }
                                                >
                                                    {
                                                        statusConfig[po.status]
                                                            .label
                                                    }
                                                </Badge>
                                                <Badge
                                                    variant={'light'}
                                                    color={
                                                        paymentStatusConfig[
                                                            po.payment_status
                                                        ].color
                                                    }
                                                    size="sm"
                                                >
                                                    {
                                                        paymentStatusConfig[
                                                            po.payment_status
                                                        ].label
                                                    }
                                                </Badge>
                                            </div>

                                            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Building2 className="h-4 w-4" />
                                                    <span>
                                                        <span className="font-medium">
                                                            Supplier:
                                                        </span>{' '}
                                                        {
                                                            po.supplier_tenant
                                                                ?.name
                                                        }
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Package className="h-4 w-4" />
                                                    <span>
                                                        <span className="font-medium">
                                                            Shop:
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
                                        </div>

                                        <Link href={show(po.id)}>
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

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
