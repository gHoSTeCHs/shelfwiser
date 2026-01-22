import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController.ts';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/modal';
import AppLayout from '@/layouts/AppLayout';
import { PurchaseOrder } from '@/types/supplier';
import { paymentStatusConfig, statusConfig } from '@/utils/purchase-order';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CheckCircle,
    CreditCard,
    DollarSign,
    Download,
    Package,
    Truck,
    XCircle,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props {
    purchaseOrder: PurchaseOrder;
    isSupplier: boolean;
    isBuyer: boolean;
}

type ConfirmAction =
    | 'submit'
    | 'approve'
    | 'ship'
    | 'receive'
    | 'cancel'
    | null;

const confirmActionConfig: Record<
    Exclude<ConfirmAction, null>,
    {
        title: string;
        message: string;
        confirmLabel: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
    }
> = {
    submit: {
        title: 'Submit Purchase Order',
        message:
            'Are you sure you want to submit this purchase order to the supplier?',
        confirmLabel: 'Submit Order',
        variant: 'info',
    },
    approve: {
        title: 'Approve Purchase Order',
        message: 'Are you sure you want to approve this purchase order?',
        confirmLabel: 'Approve Order',
        variant: 'success',
    },
    ship: {
        title: 'Mark as Shipped',
        message:
            'This will deduct stock from your inventory. Are you sure you want to mark this order as shipped?',
        confirmLabel: 'Mark as Shipped',
        variant: 'warning',
    },
    receive: {
        title: 'Confirm Receipt',
        message:
            'This will add stock to your inventory. Are you sure you want to confirm receipt of this order?',
        confirmLabel: 'Confirm Receipt',
        variant: 'success',
    },
    cancel: {
        title: 'Cancel Order',
        message:
            'Are you sure you want to cancel this order? This action cannot be undone.',
        confirmLabel: 'Cancel Order',
        variant: 'danger',
    },
};

export default function Show({
    purchaseOrder: po,
    isSupplier,
    isBuyer,
}: Props) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const {
        data: paymentData,
        setData: setPaymentData,
        post: postPayment,
        processing: processingPayment,
    } = useForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        reference_number: '',
        notes: '',
    });

    const handleConfirmAction = () => {
        switch (confirmAction) {
            case 'submit':
                router.post(
                    PurchaseOrderController.submit.url({
                        purchaseOrder: po.id,
                    }),
                );
                break;
            case 'approve':
                router.post(
                    PurchaseOrderController.approve.url({
                        purchaseOrder: po.id,
                    }),
                );
                break;
            case 'ship':
                router.post(
                    PurchaseOrderController.ship.url({ purchaseOrder: po.id }),
                );
                break;
            case 'receive':
                router.post(
                    PurchaseOrderController.receive.url({
                        purchaseOrder: po.id,
                    }),
                );
                break;
            case 'cancel':
                setConfirmAction(null);
                setShowCancelReasonModal(true);
                return;
        }
        setConfirmAction(null);
    };

    const handleCancelWithReason = () => {
        router.post(
            PurchaseOrderController.cancel.url({ purchaseOrder: po.id }),
            { reason: cancelReason },
        );
        setShowCancelReasonModal(false);
        setCancelReason('');
    };

    const handleRecordPayment: FormEventHandler = (e) => {
        e.preventDefault();
        postPayment(
            PurchaseOrderController.recordPayment.url({ purchaseOrder: po.id }),
            {
                onSuccess: () => setShowPaymentModal(false),
            },
        );
    };

    const renderActions = () => {
        const actions = [];

        if (isBuyer) {
            if (po.status === 'draft') {
                actions.push(
                    <Button
                        key="submit"
                        onClick={() => setConfirmAction('submit')}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submit Order
                    </Button>,
                );
            }

            if (po.status === 'shipped') {
                actions.push(
                    <Button
                        key="receive"
                        onClick={() => setConfirmAction('receive')}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Confirm Receipt
                    </Button>,
                );
            }

            if (['submitted', 'approved', 'processing'].includes(po.status)) {
                actions.push(
                    <Button
                        key="cancel"
                        variant="outline"
                        onClick={() => setConfirmAction('cancel')}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Order
                    </Button>,
                );
            }

            if (
                po.payment_status !== 'paid' &&
                po.payment_status !== 'cancelled'
            ) {
                actions.push(
                    <Button
                        key="payment"
                        variant="outline"
                        onClick={() => setShowPaymentModal(true)}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Record Payment
                    </Button>,
                );
            }
        }

        if (isSupplier) {
            if (po.status === 'submitted') {
                actions.push(
                    <Button
                        key="approve"
                        onClick={() => setConfirmAction('approve')}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Order
                    </Button>,
                );
                actions.push(
                    <Button
                        key="reject"
                        variant="outline"
                        onClick={() => setConfirmAction('cancel')}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Order
                    </Button>,
                );
            }

            if (po.status === 'approved' || po.status === 'processing') {
                actions.push(
                    <Button key="ship" onClick={() => setConfirmAction('ship')}>
                        <Truck className="mr-2 h-4 w-4" />
                        Mark as Shipped
                    </Button>,
                );
            }
        }

        return actions;
    };

    return (
        <>
            <Head title={`Purchase Order ${po.po_number}`} />

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Purchase Order {po.po_number}
                        </h1>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Badge
                                variant="light"
                                color={statusConfig[po.status].color}
                            >
                                {statusConfig[po.status].label}
                            </Badge>
                            <Badge
                                variant="light"
                                color={
                                    paymentStatusConfig[po.payment_status].color
                                }
                            >
                                {paymentStatusConfig[po.payment_status].label}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {renderActions()}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="p-6 lg:col-span-2">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Order Details
                        </h2>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Building2 className="h-4 w-4" />
                                        <span>Supplier</span>
                                    </div>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                        {po.supplier_tenant?.name}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Package className="h-4 w-4" />
                                        <span>Delivery Location</span>
                                    </div>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                        {po.shop?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4 dark:border-gray-700">
                                <h3 className="mb-3 font-medium text-gray-900 dark:text-white">
                                    Items
                                </h3>
                                <div className="space-y-2">
                                    {po.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {
                                                        item.product_variant
                                                            ?.product?.name
                                                    }
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    SKU:{' '}
                                                    {item.product_variant?.sku}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {item.quantity} × $
                                                    {Number(
                                                        item.unit_price,
                                                    ).toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    $
                                                    {Number(
                                                        item.total_price,
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Summary
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Subtotal
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ${Number(po.subtotal).toFixed(2)}
                                    </span>
                                </div>
                                {po.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Tax
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            ${Number(po.tax_amount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {po.shipping_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Shipping
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            $
                                            {Number(po.shipping_amount).toFixed(
                                                2,
                                            )}
                                        </span>
                                    </div>
                                )}
                                {po.discount_amount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>
                                            -${po.discount_amount.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t pt-3 text-base font-semibold dark:border-gray-700">
                                    <span className="text-gray-900 dark:text-white">
                                        Total
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                        ${Number(po.total_amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Payment
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Paid Amount
                                    </span>
                                    <span className="font-medium text-green-600">
                                        ${Number(po.paid_amount).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Outstanding
                                    </span>
                                    <span className="font-medium text-orange-600">
                                        $
                                        {(
                                            po.total_amount - po.paid_amount
                                        ).toFixed(2)}
                                    </span>
                                </div>
                                {po.payment_due_date && (
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs">
                                            Due:{' '}
                                            {new Date(
                                                po.payment_due_date,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {po.payments && po.payments.length > 0 && (
                                <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                    <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Payment History
                                    </h3>
                                    <div className="space-y-2">
                                        {po.payments.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex justify-between text-xs text-gray-600 dark:text-gray-400"
                                            >
                                                <span>
                                                    {new Date(
                                                        payment.payment_date,
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span className="font-medium">
                                                    $
                                                    {Number(
                                                        payment.amount,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {(po.expected_delivery_date ||
                            po.actual_delivery_date) && (
                            <Card className="p-6">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Delivery
                                </h2>
                                <div className="space-y-2 text-sm">
                                    {po.expected_delivery_date && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Expected:{' '}
                                                {new Date(
                                                    po.expected_delivery_date,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    {po.actual_delivery_date && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Delivered:{' '}
                                                {new Date(
                                                    po.actual_delivery_date,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {confirmAction && (
                <ConfirmDialog
                    isOpen={!!confirmAction}
                    onClose={() => setConfirmAction(null)}
                    onConfirm={handleConfirmAction}
                    title={confirmActionConfig[confirmAction].title}
                    message={confirmActionConfig[confirmAction].message}
                    confirmLabel={
                        confirmActionConfig[confirmAction].confirmLabel
                    }
                    variant={confirmActionConfig[confirmAction].variant}
                />
            )}

            <Modal
                isOpen={showCancelReasonModal}
                onClose={() => {
                    setShowCancelReasonModal(false);
                    setCancelReason('');
                }}
                className="mx-4 max-w-md"
                title="Cancel Order"
                description="Provide a reason for cancelling this order"
            >
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Cancel Order
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cancel_reason">
                                Reason for Cancellation
                            </Label>
                            <textarea
                                id="cancel_reason"
                                rows={3}
                                value={cancelReason}
                                onChange={(e) =>
                                    setCancelReason(e.target.value)
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="Please provide a reason..."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowCancelReasonModal(false);
                                    setCancelReason('');
                                }}
                                className="flex-1"
                            >
                                Go Back
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleCancelWithReason}
                                className="flex-1"
                            >
                                Cancel Order
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                className="mx-4 max-w-md"
                title="Record Payment"
                description="Record a payment for this purchase order"
            >
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Record Payment
                    </h3>

                    <form onSubmit={handleRecordPayment} className="space-y-4">
                        <div>
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={po.total_amount - po.paid_amount}
                                value={paymentData.amount}
                                onChange={(e) =>
                                    setPaymentData('amount', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="payment_date">Payment Date</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={paymentData.payment_date}
                                onChange={(e) =>
                                    setPaymentData(
                                        'payment_date',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="payment_method">
                                Payment Method
                            </Label>
                            <Input
                                id="payment_method"
                                value={paymentData.payment_method}
                                onChange={(e) =>
                                    setPaymentData(
                                        'payment_method',
                                        e.target.value,
                                    )
                                }
                                placeholder="e.g., Bank Transfer, Cash"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="reference_number">
                                Reference Number
                            </Label>
                            <Input
                                id="reference_number"
                                value={paymentData.reference_number}
                                onChange={(e) =>
                                    setPaymentData(
                                        'reference_number',
                                        e.target.value,
                                    )
                                }
                                placeholder="Transaction ID or check number"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                rows={2}
                                value={paymentData.notes}
                                onChange={(e) =>
                                    setPaymentData('notes', e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="Optional payment notes"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processingPayment}
                                className="flex-1"
                            >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Record Payment
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}

Show.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
