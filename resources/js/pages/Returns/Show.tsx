import OrderReturnController from '@/actions/App/Http/Controllers/OrderReturnController';
import Checkbox from '@/components/form/input/Checkbox';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import AppLayout from '@/layouts/AppLayout';
import { OrderReturn } from '@/types/return';
import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    DollarSign,
    Package,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    return: OrderReturn;
    can_approve: boolean;
}

export default function Show({ return: returnData, can_approve }: Props) {
    const approveModal = useModal();
    const rejectModal = useModal();

    const [restockItems, setRestockItems] = useState(true);
    const [processRefund, setProcessRefund] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'completed':
                return 'info';
            default:
                return 'light';
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number | null): string => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title={`Return ${returnData.return_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/returns"
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Returns
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Return {returnData.return_number}
                            </h1>
                            <Badge
                                variant="light"
                                color={getStatusColor(returnData.status)}
                            >
                                {returnData.status}
                            </Badge>
                        </div>
                    </div>

                    {can_approve && returnData.status === 'pending' && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={approveModal.openModal}
                                className="text-success-600 hover:text-success-700"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Return
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={rejectModal.openModal}
                                className="text-error-600 hover:text-error-700"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Return
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Return Items */}
                        <Card title="Returned Items">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200 dark:border-gray-700">
                                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                                            <th scope="col" className="pb-3 font-medium">
                                                Product
                                            </th>
                                            <th scope="col" className="pb-3 font-medium">
                                                SKU
                                            </th>
                                            <th scope="col" className="pb-3 text-right font-medium">
                                                Quantity
                                            </th>
                                            <th scope="col" className="pb-3 font-medium">
                                                Condition
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {returnData.items?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {
                                                                item.order_item
                                                                    ?.product_variant
                                                                    ?.product
                                                                    ?.name
                                                            }
                                                        </p>
                                                        {item.order_item
                                                            ?.product_variant
                                                            ?.name && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {
                                                                    item
                                                                        .order_item
                                                                        .product_variant
                                                                        .name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {
                                                        item.order_item
                                                            ?.product_variant
                                                            ?.sku
                                                    }
                                                </td>
                                                <td className="py-3 text-right text-sm text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {item.condition_notes ||
                                                        'No notes'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Return Details */}
                        <Card title="Return Details">
                            <div className="space-y-4">
                                <div>
                                    <Label>Reason for Return</Label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {returnData.reason}
                                    </p>
                                </div>

                                {returnData.notes && (
                                    <div>
                                        <Label>Additional Notes</Label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {returnData.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Summary */}
                        <Card title="Summary">
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <Package className="mr-2 h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Order Number
                                    </span>
                                    <span className="ml-auto text-gray-900 dark:text-white">
                                        {returnData.order?.order_number}
                                    </span>
                                </div>

                                <div className="flex items-center text-sm">
                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Created
                                    </span>
                                    <span className="ml-auto text-gray-900 dark:text-white">
                                        {formatDate(returnData.created_at)}
                                    </span>
                                </div>

                                {returnData.refund_amount && (
                                    <div className="flex items-center text-sm">
                                        <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Refund Amount
                                        </span>
                                        <span className="ml-auto text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                returnData.refund_amount,
                                            )}
                                        </span>
                                    </div>
                                )}

                                {returnData.restocked && (
                                    <div className="flex items-center text-sm">
                                        <CheckCircle className="mr-2 h-4 w-4 text-success-500" />
                                        <span className="text-success-600 dark:text-success-400">
                                            Items Restocked
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Timeline */}
                        <Card title="Timeline">
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <User className="mr-2 h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Created by{' '}
                                        {returnData.created_by_user?.name}
                                    </span>
                                </div>

                                {returnData.approved_at && (
                                    <div className="flex items-center text-sm">
                                        <CheckCircle className="mr-2 h-4 w-4 text-success-500" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Approved on{' '}
                                            {formatDate(returnData.approved_at)}
                                        </span>
                                    </div>
                                )}

                                {returnData.rejected_at && (
                                    <div className="flex items-center text-sm">
                                        <XCircle className="mr-2 h-4 w-4 text-error-500" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Rejected on{' '}
                                            {formatDate(returnData.rejected_at)}
                                        </span>
                                    </div>
                                )}

                                {returnData.completed_at && (
                                    <div className="flex items-center text-sm">
                                        <Package className="text-info-500 mr-2 h-4 w-4" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Completed on{' '}
                                            {formatDate(
                                                returnData.completed_at,
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            <Modal
                show={approveModal.isOpen}
                onClose={approveModal.closeModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Approve Return
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Confirm the approval of this return request.
                    </p>

                    <Form
                        action={OrderReturnController.approve.url({
                            return: returnData.id,
                        })}
                        method="post"
                        onSuccess={approveModal.closeModal}
                    >
                        {() => (
                            <div className="mt-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="restock_items"
                                        checked={restockItems}
                                        onChange={(e) =>
                                            setRestockItems(e.target.checked)
                                        }
                                    />
                                    <input
                                        type="hidden"
                                        name="restock_items"
                                        value={restockItems ? '1' : '0'}
                                    />
                                    <Label htmlFor="restock_items">
                                        Restock returned items
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="process_refund"
                                        checked={processRefund}
                                        onChange={(e) =>
                                            setProcessRefund(e.target.checked)
                                        }
                                    />
                                    <input
                                        type="hidden"
                                        name="process_refund"
                                        value={processRefund ? '1' : '0'}
                                    />
                                    <Label htmlFor="process_refund">
                                        Process refund to customer
                                    </Label>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={approveModal.closeModal}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve Return
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                show={rejectModal.isOpen}
                onClose={rejectModal.closeModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Reject Return
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Provide a reason for rejecting this return request.
                    </p>

                    <Form
                        action={OrderReturnController.reject.url({
                            return: returnData.id,
                        })}
                        method="post"
                        onSuccess={rejectModal.closeModal}
                    >
                        {() => (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <Label htmlFor="rejection_reason">
                                        Rejection Reason
                                    </Label>
                                    <TextArea
                                        value={rejectionReason}
                                        onChange={(value) =>
                                            setRejectionReason(value)
                                        }
                                        placeholder="Explain why this return is being rejected..."
                                        rows={4}
                                    />
                                    <input
                                        type="hidden"
                                        name="rejection_reason"
                                        value={rejectionReason}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={rejectModal.closeModal}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="destructive">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject Return
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </div>
            </Modal>
        </AppLayout>
    );
}

Show.layout = (page: React.ReactNode) => page;
