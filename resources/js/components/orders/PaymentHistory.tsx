import OrderPaymentController from '@/actions/App/Http/Controllers/OrderPaymentController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import {
    getInternalPaymentMethodColor,
    getInternalPaymentMethodLabel,
    InternalPaymentMethod,
} from '@/types/payment';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Payment {
    id: number;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
    recorded_by: {
        id: number;
        first_name: string;
        last_name: string;
    };
    created_at: string;
}

interface PaymentHistoryProps {
    payments: Payment[];
    canDelete: boolean;
}

export default function PaymentHistory({
    payments,
    canDelete,
}: PaymentHistoryProps) {
    const { confirm, ConfirmDialogComponent } = useConfirmDialog();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (paymentId: number) => {
        const confirmed = await confirm({
            title: 'Delete Payment',
            message: 'Are you sure you want to delete this payment record? This action cannot be undone.',
            variant: 'danger',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
        });
        if (!confirmed) return;

        setDeletingId(paymentId);
        router.delete(OrderPaymentController.destroy.url({ orderPayment: paymentId }), {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const totalPaid = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount.toString()),
        0,
    );

    if (payments.length === 0) {
        return (
            <Card title="Payment History">
                <div className="py-8 text-center text-gray-500">
                    No payments recorded yet
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="Payment History"
            description={`Total Paid: ${formatCurrency(totalPaid)} (${payments.length} payment${payments.length > 1 ? 's' : ''})`}
        >
            <div className="space-y-4">
                {payments.map((payment) => (
                    <div
                        key={payment.id}
                        className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-semibold text-gray-900">
                                        {formatCurrency(payment.amount)}
                                    </span>
                                    <Badge
                                        color={getInternalPaymentMethodColor(
                                            payment.payment_method as InternalPaymentMethod,
                                        )}
                                        variant="light"
                                    >
                                        {getInternalPaymentMethodLabel(
                                            payment.payment_method as InternalPaymentMethod,
                                        )}
                                    </Badge>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">
                                            Date:
                                        </span>{' '}
                                        {formatDateShort(payment.payment_date)}
                                    </div>
                                    {payment.reference_number && (
                                        <div>
                                            <span className="font-medium">
                                                Reference:
                                            </span>{' '}
                                            {payment.reference_number}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-medium">
                                            Recorded by:
                                        </span>{' '}
                                        {payment.recorded_by.first_name}{' '}
                                        {payment.recorded_by.last_name}
                                    </div>
                                    {payment.notes && (
                                        <div>
                                            <span className="font-medium">
                                                Notes:
                                            </span>{' '}
                                            {payment.notes}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {canDelete && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={deletingId === payment.id}
                                    loading={deletingId === payment.id}
                                    startIcon={<Trash2 size={16} />}
                                    onClick={() => handleDelete(payment.id)}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialogComponent />
        </Card>
    );
}
