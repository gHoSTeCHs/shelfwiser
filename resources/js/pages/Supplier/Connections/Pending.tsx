import SupplierConnectionController from '@/actions/App/Http/Controllers/SupplierConnectionController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/hooks/useToast';
import AppLayout from '@/layouts/AppLayout';
import { formatDateShort } from '@/lib/formatters';
import { SupplierConnection } from '@/types/supplier';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react';

interface Props {
    connections: SupplierConnection[];
}

export default function Pending({ connections }: Props) {
    const toast = useToast();
    const { confirm, ConfirmDialogComponent } = useConfirmDialog();

    const handleApprove = async (connection: SupplierConnection) => {
        const buyerNotes = connection.buyer_notes
            ? `\n\nBuyer's message: "${connection.buyer_notes}"`
            : '';

        const confirmed = await confirm({
            title: 'Approve Connection Request',
            message: `Are you sure you want to approve this connection request? ${connection.buyer_tenant?.name} will be able to view your catalog and place orders.${buyerNotes}`,
            confirmLabel: 'Approve Connection',
            variant: 'info',
        });

        if (confirmed) {
            router.post(
                SupplierConnectionController.approve.url({
                    connection: connection.id,
                }),
                {},
                {
                    onSuccess: () => {
                        toast.success('Connection approved successfully');
                    },
                    onError: () => {
                        toast.error('Failed to approve connection');
                    },
                },
            );
        }
    };

    const handleReject = async (connection: SupplierConnection) => {
        const confirmed = await confirm({
            title: 'Reject Connection Request',
            message: `Are you sure you want to reject this connection request? ${connection.buyer_tenant?.name} will not be able to access your catalog or place orders.`,
            confirmLabel: 'Reject Request',
            variant: 'warning',
        });

        if (confirmed) {
            router.post(
                SupplierConnectionController.reject.url({
                    connection: connection.id,
                }),
                {},
                {
                    onSuccess: () => {
                        toast.success('Connection rejected');
                    },
                    onError: () => {
                        toast.error('Failed to reject connection');
                    },
                },
            );
        }
    };

    return (
        <AppLayout>
            <Head title="Pending Connection Requests" />
            <ConfirmDialogComponent />

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
                                                            {formatDateShort(connection.requested_at)}
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
