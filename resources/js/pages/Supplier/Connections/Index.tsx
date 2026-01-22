import SupplierConnectionController from '@/actions/App/Http/Controllers/SupplierConnectionController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { ConnectionStatus, SupplierConnection } from '@/types/supplier';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    Network,
    Pause,
    Play,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

type ConnectionAction = 'approve' | 'reject' | 'suspend' | 'activate' | null;

interface ConfirmState {
    action: ConnectionAction;
    connectionId: number | null;
}

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

const actionConfig: Record<
    Exclude<ConnectionAction, null>,
    {
        title: string;
        message: string;
        confirmLabel: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
    }
> = {
    approve: {
        title: 'Approve Connection',
        message:
            'Are you sure you want to approve this connection request? The buyer will be able to place orders.',
        confirmLabel: 'Approve',
        variant: 'success',
    },
    reject: {
        title: 'Reject Connection',
        message:
            'Are you sure you want to reject this connection request? This action cannot be undone.',
        confirmLabel: 'Reject',
        variant: 'danger',
    },
    suspend: {
        title: 'Suspend Connection',
        message:
            'Are you sure you want to suspend this connection? The buyer will not be able to place new orders.',
        confirmLabel: 'Suspend',
        variant: 'warning',
    },
    activate: {
        title: 'Activate Connection',
        message:
            'Are you sure you want to activate this connection? The buyer will be able to place orders.',
        confirmLabel: 'Activate',
        variant: 'success',
    },
};

export default function Index({
    buyerConnections,
    supplierConnections,
}: Props) {
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        action: null,
        connectionId: null,
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const openConfirm = (
        action: Exclude<ConnectionAction, null>,
        connectionId: number,
    ) => {
        setConfirmState({ action, connectionId });
    };

    const closeConfirm = () => {
        setConfirmState({ action: null, connectionId: null });
    };

    const handleConfirmAction = () => {
        if (!confirmState.action || !confirmState.connectionId) return;

        setIsProcessing(true);
        const id = confirmState.connectionId;

        const actionMap: Record<Exclude<ConnectionAction, null>, () => void> = {
            approve: () =>
                router.post(SupplierConnectionController.approve.url({ id })),
            reject: () =>
                router.post(SupplierConnectionController.reject.url({ id })),
            suspend: () =>
                router.post(SupplierConnectionController.suspend.url({ id })),
            activate: () =>
                router.post(SupplierConnectionController.activate.url({ id })),
        };

        actionMap[confirmState.action]();
        setIsProcessing(false);
        closeConfirm();
    };

    return (
        <>
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
                                                        openConfirm(
                                                            'approve',
                                                            conn.id,
                                                        )
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
                                                        openConfirm(
                                                            'reject',
                                                            conn.id,
                                                        )
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
                                                        openConfirm(
                                                            'suspend',
                                                            conn.id,
                                                        )
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
                                                        openConfirm(
                                                            'activate',
                                                            conn.id,
                                                        )
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

            {confirmState.action && (
                <ConfirmDialog
                    isOpen={!!confirmState.action}
                    onClose={closeConfirm}
                    onConfirm={handleConfirmAction}
                    title={actionConfig[confirmState.action].title}
                    message={actionConfig[confirmState.action].message}
                    confirmLabel={
                        actionConfig[confirmState.action].confirmLabel
                    }
                    variant={actionConfig[confirmState.action].variant}
                    isLoading={isProcessing}
                />
            )}
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
