import OrderController from '@/actions/App/Http/Controllers/OrderController';
import ReceiptController from '@/actions/App/Http/Controllers/ReceiptController';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import TextArea from '@/components/form/input/TextArea';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import AppLayout from '@/layouts/AppLayout';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle,
    CreditCard,
    Download,
    FileText,
    Package,
    Truck,
    User,
    XCircle,
} from 'lucide-react';
import { FormEvent } from 'react';

type BadgeColor =
    | 'primary'
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';

interface Props {
    order: Order;
    can_manage: boolean;
    order_statuses: Record<string, string>;
    payment_statuses: Record<string, string>;
}

export default function Show({
    order,
    can_manage,
    order_statuses,
    payment_statuses,
}: Props) {
    const statusModal = useModal();
    const paymentModal = useModal();
    const cancelModal = useModal();

    // Status update form
    const statusForm = useForm({
        status: order.status as OrderStatus,
    });

    // Payment update form
    const paymentForm = useForm({
        payment_status: order.payment_status as PaymentStatus,
        payment_method: order.payment_method || '',
    });

    // Cancel order form
    const cancelForm = useForm({
        status: 'cancelled' as OrderStatus,
        reason: '',
    });

    const getStatusColor = (status: OrderStatus): BadgeColor => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'confirmed':
            case 'processing':
                return 'info';
            case 'packed':
            case 'shipped':
                return 'primary';
            case 'delivered':
                return 'success';
            case 'cancelled':
            case 'refunded':
                return 'error';
            default:
                return 'light';
        }
    };

    const getPaymentStatusColor = (status: PaymentStatus): BadgeColor => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'partial':
                return 'warning';
            case 'unpaid':
                return 'error';
            case 'refunded':
                return 'info';
            case 'failed':
                return 'error';
            default:
                return 'light';
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title={`Order ${order.order_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={'/orders'}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Order {order.order_number}
                            </h1>
                            <Badge
                                variant="light"
                                color={getStatusColor(order.status)}
                            >
                                {order_statuses[order.status]}
                            </Badge>
                            <Badge
                                variant="light"
                                color={getPaymentStatusColor(
                                    order.payment_status,
                                )}
                            >
                                {payment_statuses[order.payment_status]}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <a
                            href={ReceiptController.viewOrderReceipt.url({
                                order: order.id,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm">
                                <FileText className="mr-2 h-4 w-4" />
                                View Receipt
                            </Button>
                        </a>
                        <a
                            href={ReceiptController.downloadOrderReceipt.url({
                                order: order.id,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download Receipt
                            </Button>
                        </a>
                        {can_manage && (
                            <>
                                {order.status !== 'cancelled' &&
                                    order.status !== 'delivered' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={statusModal.openModal}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Update Status
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={paymentModal.openModal}
                                            >
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Update Payment
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={cancelModal.openModal}
                                                className="text-error-600 hover:text-error-700"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Cancel Order
                                            </Button>
                                        </>
                                    )}
                                {(order.status === 'delivered' ||
                                    order.status === 'completed') &&
                                    order.status !== 'refunded' && (
                                        <Link
                                            href={`/orders/${order.id}/return`}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-warning-600 hover:text-warning-700"
                                            >
                                                <Package className="mr-2 h-4 w-4" />
                                                Process Return
                                            </Button>
                                        </Link>
                                    )}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card title="Order Items">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200 dark:border-gray-700">
                                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                                            <th className="pb-3 font-medium">
                                                Product
                                            </th>
                                            <th className="pb-3 font-medium">
                                                SKU
                                            </th>
                                            <th className="pb-3 font-medium">
                                                Packaging
                                            </th>
                                            <th className="pb-3 text-right font-medium">
                                                Quantity
                                            </th>
                                            <th className="pb-3 text-right font-medium">
                                                Unit Price
                                            </th>
                                            <th className="pb-3 text-right font-medium">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {order.items?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {
                                                                item
                                                                    .product_variant
                                                                    ?.product
                                                                    ?.name
                                                            }
                                                        </p>
                                                        {item.product_variant
                                                            ?.name && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {
                                                                    item
                                                                        .product_variant
                                                                        .name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {item.product_variant?.sku}
                                                </td>
                                                <td className="py-3">
                                                    {item.packaging_type ? (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {
                                                                    item.package_quantity
                                                                }{' '}
                                                                {item.packaging_description ||
                                                                    item
                                                                        .packaging_type
                                                                        .display_name ||
                                                                    item
                                                                        .packaging_type
                                                                        .name}
                                                                {item.package_quantity &&
                                                                item.package_quantity >
                                                                    1
                                                                    ? 's'
                                                                    : ''}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                (
                                                                {
                                                                    item
                                                                        .packaging_type
                                                                        .units_per_package
                                                                }{' '}
                                                                {
                                                                    item
                                                                        .product_variant
                                                                        ?.base_unit_name
                                                                }
                                                                {item
                                                                    .packaging_type
                                                                    .units_per_package >
                                                                1
                                                                    ? 's'
                                                                    : ''}{' '}
                                                                each)
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Loose
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-3 text-right text-gray-900 dark:text-white">
                                                    {formatCurrency(
                                                        item.unit_price,
                                                    )}
                                                </td>
                                                <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(
                                                        item.total_amount,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Subtotal
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(order.subtotal)}
                                    </span>
                                </div>
                                {order.shipping_cost > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Shipping
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                order.shipping_cost,
                                            )}
                                        </span>
                                    </div>
                                )}
                                {order.discount_amount > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Discount
                                        </span>
                                        <span className="font-medium text-success-600 dark:text-success-400">
                                            -
                                            {formatCurrency(
                                                order.discount_amount,
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total
                                    </span>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(order.total_amount)}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {(order.customer_notes || order.internal_notes) && (
                            <Card title="Notes">
                                <div className="space-y-4">
                                    {order.customer_notes && (
                                        <div>
                                            <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                                Customer Notes
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {order.customer_notes}
                                            </p>
                                        </div>
                                    )}
                                    {order.internal_notes && (
                                        <div>
                                            <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                                Internal Notes
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {order.internal_notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {(order.shipping_address || order.billing_address) && (
                            <Card title="Addresses">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {order.shipping_address && (
                                        <div>
                                            <h4 className="mb-2 flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                                <Truck className="mr-2 h-4 w-4" />
                                                Shipping Address
                                            </h4>
                                            <p className="text-sm whitespace-pre-line text-gray-600 dark:text-gray-300">
                                                {order.shipping_address}
                                            </p>
                                        </div>
                                    )}
                                    {order.billing_address && (
                                        <div>
                                            <h4 className="mb-2 flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Billing Address
                                            </h4>
                                            <p className="text-sm whitespace-pre-line text-gray-600 dark:text-gray-300">
                                                {order.billing_address}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card title="Order Information">
                            <div className="space-y-3">
                                {order.customer && (
                                    <div className="flex items-start gap-2">
                                        <User className="mt-0.5 h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Customer
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {order.customer.name}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-2">
                                    <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Shop
                                        </p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {order.shop?.name}
                                        </p>
                                    </div>
                                </div>

                                {order.payment_method && (
                                    <div className="flex items-start gap-2">
                                        <CreditCard className="mt-0.5 h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Payment Method
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {order.payment_method}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card title="Timeline">
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Created
                                    </span>
                                    <span className="ml-auto text-gray-900 dark:text-white">
                                        {formatDate(order.created_at)}
                                    </span>
                                </div>
                                {order.confirmed_at && (
                                    <div className="flex items-center text-sm">
                                        <CheckCircle className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Confirmed
                                        </span>
                                        <span className="ml-auto text-gray-900 dark:text-white">
                                            {formatDate(order.confirmed_at)}
                                        </span>
                                    </div>
                                )}
                                {order.packed_at && (
                                    <div className="flex items-center text-sm">
                                        <Package className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Packed
                                        </span>
                                        <span className="ml-auto text-gray-900 dark:text-white">
                                            {formatDate(order.packed_at)}
                                        </span>
                                    </div>
                                )}
                                {order.shipped_at && (
                                    <div className="flex items-center text-sm">
                                        <Truck className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Shipped
                                            {order.tracking_number && (
                                                <span className="ml-2 text-xs text-gray-400">
                                                    ({order.tracking_number})
                                                </span>
                                            )}
                                        </span>
                                        <span className="ml-auto text-gray-900 dark:text-white">
                                            {formatDate(order.shipped_at)}
                                        </span>
                                    </div>
                                )}
                                {order.delivered_at && (
                                    <div className="flex items-center text-sm">
                                        <CheckCircle className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Delivered
                                        </span>
                                        <span className="ml-auto text-gray-900 dark:text-white">
                                            {formatDate(order.delivered_at)}
                                        </span>
                                    </div>
                                )}
                                {order.refunded_at && (
                                    <div className="flex items-center text-sm">
                                        <XCircle className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Refunded
                                        </span>
                                        <span className="ml-auto text-gray-900 dark:text-white">
                                            {formatDate(order.refunded_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Update Order Status Modal */}
            <Modal
                isOpen={statusModal.isOpen}
                onClose={statusModal.closeModal}
                className="max-w-md"
            >
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Update Order Status
                </h3>
                <form
                    onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        statusForm.post(
                            OrderController.updateStatus.url({
                                order: order.id,
                            }),
                            {
                                onSuccess: () => {
                                    statusModal.closeModal();
                                },
                            },
                        );
                    }}
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                options={Object.entries(order_statuses).map(
                                    ([value, label]) => ({
                                        value,
                                        label,
                                    }),
                                )}
                                placeholder="Select status"
                                onChange={(value) =>
                                    statusForm.setData(
                                        'status',
                                        value as OrderStatus,
                                    )
                                }
                                defaultValue={order.status}
                            />
                            <InputError message={statusForm.errors.status} />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={statusModal.closeModal}
                                disabled={statusForm.processing}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={statusForm.processing}
                                className="flex-1"
                            >
                                {statusForm.processing
                                    ? 'Updating...'
                                    : 'Update Status'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Update Payment Status Modal */}
            <Modal
                isOpen={paymentModal.isOpen}
                onClose={paymentModal.closeModal}
                className="max-w-md"
            >
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Update Payment Status
                </h3>
                <form
                    onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        paymentForm.post(
                            OrderController.updatePaymentStatus.url({
                                order: order.id,
                            }),
                            {
                                onSuccess: () => {
                                    paymentModal.closeModal();
                                },
                            },
                        );
                    }}
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="payment_status">
                                Payment Status
                            </Label>
                            <Select
                                options={Object.entries(payment_statuses).map(
                                    ([value, label]) => ({
                                        value,
                                        label,
                                    }),
                                )}
                                placeholder="Select payment status"
                                onChange={(value) =>
                                    paymentForm.setData(
                                        'payment_status',
                                        value as PaymentStatus,
                                    )
                                }
                                defaultValue={order.payment_status}
                            />
                            <InputError
                                message={paymentForm.errors.payment_status}
                            />
                        </div>

                        <div>
                            <Label htmlFor="payment_method">
                                Payment Method
                            </Label>
                            <Select
                                options={[
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'card', label: 'Card' },
                                    {
                                        value: 'bank_transfer',
                                        label: 'Bank Transfer',
                                    },
                                    {
                                        value: 'mobile_money',
                                        label: 'Mobile Money',
                                    },
                                ]}
                                placeholder="Select payment method"
                                onChange={(value) =>
                                    paymentForm.setData('payment_method', value)
                                }
                                defaultValue={order.payment_method || ''}
                            />
                            <InputError
                                message={paymentForm.errors.payment_method}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={paymentModal.closeModal}
                                disabled={paymentForm.processing}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={paymentForm.processing}
                                className="flex-1"
                            >
                                {paymentForm.processing
                                    ? 'Updating...'
                                    : 'Update Payment'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Cancel Order Modal */}
            <Modal
                isOpen={cancelModal.isOpen}
                onClose={cancelModal.closeModal}
                className="max-w-md"
            >
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Cancel Order
                </h3>
                <form
                    onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        cancelForm.post(
                            OrderController.updateStatus.url({
                                order: order.id,
                            }),
                            {
                                onSuccess: () => {
                                    cancelModal.closeModal();
                                    cancelForm.reset();
                                },
                            },
                        );
                    }}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Are you sure you want to cancel this order? This
                            action will release any reserved stock.
                        </p>

                        <div>
                            <Label htmlFor="reason">
                                Reason for Cancellation
                            </Label>
                            <TextArea
                                id="reason"
                                value={cancelForm.data.reason}
                                onChange={(value) =>
                                    cancelForm.setData('reason', value)
                                }
                                placeholder="Enter reason for cancellation"
                                rows={3}
                            />
                            <InputError message={cancelForm.errors.reason} />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={cancelModal.closeModal}
                                disabled={cancelForm.processing}
                                className="flex-1"
                            >
                                Keep Order
                            </Button>
                            <Button
                                type="submit"
                                disabled={cancelForm.processing}
                                className="flex-1 bg-error-600 hover:bg-error-700"
                            >
                                {cancelForm.processing
                                    ? 'Cancelling...'
                                    : 'Cancel Order'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
