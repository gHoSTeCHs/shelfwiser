import { Form } from '@inertiajs/react';
import OrderPaymentController from '@/actions/App/Http/Controllers/OrderPaymentController';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

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

export default function PaymentHistory({ payments, canDelete }: PaymentHistoryProps) {
    const formatCurrency = (value: number) => {
        return `¦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatPaymentMethod = (method: string) => {
        const methods: Record<string, string> = {
            cash: 'Cash',
            card: 'Card',
            bank_transfer: 'Bank Transfer',
            mobile_money: 'Mobile Money',
            customer_credit: 'Customer Credit',
        };
        return methods[method] || method;
    };

    const getPaymentMethodColor = (method: string) => {
        const colors: Record<string, 'success' | 'info' | 'warning' | 'primary'> = {
            cash: 'success',
            card: 'info',
            bank_transfer: 'primary',
            mobile_money: 'warning',
            customer_credit: 'info',
        };
        return colors[method] || 'primary';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);

    if (payments.length === 0) {
        return (
            <Card title="Payment History">
                <div className="text-center py-8 text-gray-500">
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
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-semibold text-gray-900">
                                        {formatCurrency(payment.amount)}
                                    </span>
                                    <Badge
                                        color={getPaymentMethodColor(payment.payment_method)}
                                        variant="light"
                                    >
                                        {formatPaymentMethod(payment.payment_method)}
                                    </Badge>
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>
                                        <span className="font-medium">Date:</span> {formatDate(payment.payment_date)}
                                    </div>
                                    {payment.reference_number && (
                                        <div>
                                            <span className="font-medium">Reference:</span> {payment.reference_number}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-medium">Recorded by:</span>{' '}
                                        {payment.recorded_by.first_name} {payment.recorded_by.last_name}
                                    </div>
                                    {payment.notes && (
                                        <div>
                                            <span className="font-medium">Notes:</span> {payment.notes}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {canDelete && (
                                <Form
                                    action={OrderPaymentController.destroy.url({ orderPayment: payment.id })}
                                    method="delete"
                                    onBefore={() => confirm('Are you sure you want to delete this payment record? This action cannot be undone.')}
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            size="sm"
                                            disabled={processing}
                                            startIcon={<Trash2 size={16} />}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
