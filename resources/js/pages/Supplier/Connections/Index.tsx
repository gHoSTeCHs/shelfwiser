import SupplierConnectionController from '@/actions/App/Http/Controllers/SupplierConnectionController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { ConnectionStatus, SupplierConnection } from '@/types/supplier';
import { Head } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    Network,
    Pause,
    Play,
    XCircle,
} from 'lucide-react';

interface Props {
    buyerConnections: SupplierConnection[];
    supplierConnections: SupplierConnection[];
}

const statusConfig: Record<
    ConnectionStatus,
    {
        label: string;
        variant: 'primary' | 'warning' | 'success' | 'error';
    }
> = {
    pending: { label: 'Pending Approval', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'error' },
    rejected: { label: 'Rejected', variant: 'error' },
};

export default function Index({
    buyerConnections,
    supplierConnections,
}: Props) {
    const handleApprove = (id: number) => {
        if (confirm('Approve this connection request?')) {
            SupplierConnectionController.approve({
                id: id,
            });
        }
    };

    const handleReject = (id: number) => {
        if (confirm('Reject this connection request?')) {
            SupplierConnectionController.reject({
                id: id,
            });
        }
    };

    const handleSuspend = (id: number) => {
        SupplierConnectionController.suspend({
            id: id,
        });
    };

    const handleActivate = (id: number) => {
        SupplierConnectionController.activate({
            id: id,
        });
    };

    return (
        <AppLayout>
            <Head title="Supplier Connections" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Supplier Connections
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your supplier and buyer relationships
                    </p>
                </div>

                {/* Connections as Buyer */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Your Suppliers
                    </h2>

                    {buyerConnections.length === 0 ? (
                        <EmptyState
                            icon={<Building2 className="h-10 w-10" />}
                            title="No supplier connections"
                            description="Connect with suppliers to start ordering products"
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {buyerConnections.map((conn) => (
                                <Card key={conn.id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-5 w-5 text-gray-400" />
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {conn.supplier_tenant?.name}
                                                </h3>
                                            </div>
                                            <Badge
                                                variant={'solid'}
                                                color={
                                                    statusConfig[conn.status]
                                                        .variant
                                                }
                                                size="sm"
                                            >
                                                {
                                                    statusConfig[conn.status]
                                                        .label
                                                }
                                            </Badge>

                                            <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                {conn.payment_terms_override && (
                                                    <p>
                                                        <span className="font-medium">
                                                            Payment Terms:
                                                        </span>{' '}
                                                        {
                                                            conn.payment_terms_override
                                                        }
                                                    </p>
                                                )}
                                                {conn.credit_limit && (
                                                    <p>
                                                        <span className="font-medium">
                                                            Credit Limit:
                                                        </span>{' '}
                                                        $
                                                        {conn.credit_limit.toFixed(
                                                            2,
                                                        )}
                                                    </p>
                                                )}
                                                <p className="text-xs">
                                                    Requested:{' '}
                                                    {new Date(
                                                        conn.requested_at,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Connections as Supplier */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Your Buyers
                    </h2>

                    {supplierConnections.length === 0 ? (
                        <EmptyState
                            icon={<Network className="h-10 w-10" />}
                            title="No buyer connections"
                            description="Enable supplier mode to receive connection requests from buyers"
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {supplierConnections.map((conn) => (
                                <Card key={conn.id} className="p-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-5 w-5 text-gray-400" />
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {
                                                            conn.buyer_tenant
                                                                ?.name
                                                        }
                                                    </h3>
                                                </div>
                                                <Badge
                                                    variant={'light'}
                                                    color={
                                                        statusConfig[
                                                            conn.status
                                                        ].variant
                                                    }
                                                    size="sm"
                                                >
                                                    {
                                                        statusConfig[
                                                            conn.status
                                                        ].label
                                                    }
                                                </Badge>
                                            </div>
                                        </div>

                                        {conn.buyer_notes && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {conn.buyer_notes}
                                            </p>
                                        )}

                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Requested:{' '}
                                            {new Date(
                                                conn.requested_at,
                                            ).toLocaleDateString()}
                                        </div>

                                        {conn.status === 'pending' && (
                                            <div className="flex gap-2 border-t pt-3 dark:border-gray-700">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleApprove(conn.id)
                                                    }
                                                    className="flex-1"
                                                >
                                                    <CheckCircle className="mr-1 h-4 w-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleReject(conn.id)
                                                    }
                                                    className="flex-1"
                                                >
                                                    <XCircle className="mr-1 h-4 w-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

                                        {(conn.status === 'approved' ||
                                            conn.status === 'active') && (
                                            <div className="border-t pt-3 dark:border-gray-700">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleSuspend(conn.id)
                                                    }
                                                    className="w-full"
                                                >
                                                    <Pause className="mr-1 h-4 w-4" />
                                                    Suspend
                                                </Button>
                                            </div>
                                        )}

                                        {conn.status === 'suspended' && (
                                            <div className="border-t pt-3 dark:border-gray-700">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleActivate(conn.id)
                                                    }
                                                    className="w-full"
                                                >
                                                    <Play className="mr-1 h-4 w-4" />
                                                    Activate
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
