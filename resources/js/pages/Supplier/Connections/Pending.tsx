import SupplierConnectionController from '@/actions/App/Http/Controllers/SupplierConnectionController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import AppLayout from '@/layouts/AppLayout';
import { SupplierConnection } from '@/types/supplier';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react';

interface Props {
    connections: SupplierConnection[];
}

export default function Pending({ connections }: Props) {
    const { toast } = useToast();
    const { openModal, closeModal } = useModal();

    const handleApprove = (connection: SupplierConnection) => {
        openModal({
            title: 'Approve Connection Request',
            content: (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-info-50 p-4 dark:bg-info-950/50">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-info-600 dark:text-info-400" />
                        <div className="text-sm text-info-700 dark:text-info-300">
                            <p className="font-medium">
                                Are you sure you want to approve this connection
                                request?
                            </p>
                            <p className="mt-1">
                                {connection.buyer_tenant?.name} will be able to
                                view your catalog and place orders.
                            </p>
                        </div>
                    </div>

                    {connection.buyer_notes && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Buyer's Message:
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {connection.buyer_notes}
                            </p>
                        </div>
                    )}
                </div>
            ),
            onConfirm: () => {
                router.post(
                    SupplierConnectionController.approve.url({
                        connection: connection.id,
                    }),
                    {},
                    {
                        onSuccess: () => {
                            toast.success('Connection approved successfully');
                            closeModal();
                        },
                        onError: () => {
                            toast.error('Failed to approve connection');
                        },
                    },
                );
            },
            confirmText: 'Approve Connection',
            confirmVariant: 'primary',
        });
    };

    const handleReject = (connection: SupplierConnection) => {
        openModal({
            title: 'Reject Connection Request',
            content: (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-warning-50 p-4 dark:bg-warning-950/50">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-600 dark:text-warning-400" />
                        <div className="text-sm text-warning-700 dark:text-warning-300">
                            <p className="font-medium">
                                Are you sure you want to reject this connection
                                request?
                            </p>
                            <p className="mt-1">
                                {connection.buyer_tenant?.name} will not be
                                able to access your catalog or place orders.
                            </p>
                        </div>
                    </div>
                </div>
            ),
            onConfirm: () => {
                router.post(
                    SupplierConnectionController.reject.url({
                        connection: connection.id,
                    }),
                    {},
                    {
                        onSuccess: () => {
                            toast.success('Connection rejected');
                            closeModal();
                        },
                        onError: () => {
                            toast.error('Failed to reject connection');
                        },
                    },
                );
            },
            confirmText: 'Reject Request',
            confirmVariant: 'destructive',
        });
    };

    return (
        <AppLayout>
            <Head title="Pending Connection Requests" />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pending Connection Requests
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Review and respond to buyer connection requests
                    </p>
                </div>

                {connections.length === 0 ? (
                    <EmptyState
                        icon={<Clock className="h-12 w-12" />}
                        title="No pending requests"
                        description="You have no pending connection requests at this time. Buyers will be able to request to connect with your supplier account."
                    />
                ) : (
                    <div className="space-y-4">
                        {connections.map((connection) => (
                            <Card
                                key={connection.id}
                                className="overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-950/50">
                                                    <Building2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {
                                                            connection
                                                                .buyer_tenant
                                                                ?.name
                                                        }
                                                    </h3>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <Badge
                                                            color="warning"
                                                            size="sm"
                                                        >
                                                            Pending Approval
                                                        </Badge>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            <Clock className="mr-1 inline h-3 w-3" />
                                                            Requested{' '}
                                                            {new Date(
                                                                connection.requested_at,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {connection.buyer_notes && (
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        Message from buyer:
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                        {connection.buyer_notes}
                                                    </p>
                                                </div>
                                            )}

                                            {connection.buyer_tenant?.slug && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium">
                                                        Business:
                                                    </span>{' '}
                                                    {
                                                        connection.buyer_tenant
                                                            .slug
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 sm:min-w-[200px]">
                                            <Button
                                                variant="primary"
                                                className="w-full justify-center"
                                                onClick={() =>
                                                    handleApprove(connection)
                                                }
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-center"
                                                onClick={() =>
                                                    handleReject(connection)
                                                }
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

Pending.layout = (page: React.ReactNode) => page;
