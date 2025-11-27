import AppLayout from '@/layouts/AppLayout';
import { Head, Link, Form } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import { ArrowLeft, Download, Mail, Eye, FileText } from 'lucide-react';
import ReceiptController from '@/actions/App/Http/Controllers/ReceiptController';
import { ReceiptShowProps } from '@/types/receipt';

/**
 * Receipt detail page showing receipt information with download and email options.
 */
const Show: React.FC<ReceiptShowProps> = ({ receipt }) => {
    const [showEmailForm, setShowEmailForm] = React.useState(false);

    const getReceiptTypeBadge = (type: string) => {
        return type === 'order' ? (
            <Badge color="primary">Order Receipt</Badge>
        ) : (
            <Badge color="success">Payment Receipt</Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return `${receipt.shop?.currency_symbol || '₦'}${parseFloat(amount.toString()).toFixed(2)}`;
    };

    const viewUrl =
        receipt.type === 'order' && receipt.order_id
            ? ReceiptController.orders.view.url({ order: receipt.order_id })
            : receipt.type === 'payment' && receipt.order_payment_id
            ? ReceiptController.payments.view.url({ payment: receipt.order_payment_id })
            : null;

    const downloadUrl =
        receipt.type === 'order' && receipt.order_id
            ? ReceiptController.orders.download.url({ order: receipt.order_id })
            : receipt.type === 'payment' && receipt.order_payment_id
            ? ReceiptController.payments.download.url({ payment: receipt.order_payment_id })
            : null;

    return (
        <AppLayout>
            <Head title={`Receipt ${receipt.receipt_number}`} />

            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={ReceiptController.index.url()}>
                            <Button variant="outline" startIcon={<ArrowLeft />}>
                                Back to Receipts
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {receipt.receipt_number}
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Generated on{' '}
                                {new Date(receipt.generated_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {viewUrl && (
                            <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" startIcon={<Eye />}>
                                    View PDF
                                </Button>
                            </a>
                        )}
                        {downloadUrl && (
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="primary" startIcon={<Download />}>
                                    Download PDF
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Receipt Information</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <div className="mt-1">{getReceiptTypeBadge(receipt.type)}</div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Amount</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(receipt.amount)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Shop</p>
                                <p className="font-medium text-gray-900 mt-1">{receipt.shop?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Generated By</p>
                                <p className="font-medium text-gray-900 mt-1">
                                    {receipt.generated_by_user
                                        ? `${receipt.generated_by_user.first_name} ${receipt.generated_by_user.last_name}`
                                        : 'System'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Related Information</h2>
                        <div className="space-y-3">
                            {receipt.order && (
                                <div>
                                    <p className="text-sm text-gray-600">Order Number</p>
                                    <p className="font-medium text-gray-900 mt-1">
                                        {receipt.order.order_number}
                                    </p>
                                </div>
                            )}
                            {receipt.customer && (
                                <div>
                                    <p className="text-sm text-gray-600">Customer</p>
                                    <p className="font-medium text-gray-900 mt-1">
                                        {receipt.customer.first_name} {receipt.customer.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {receipt.customer.email}
                                    </p>
                                    {receipt.customer.phone && (
                                        <p className="text-sm text-gray-600">{receipt.customer.phone}</p>
                                    )}
                                </div>
                            )}
                            {receipt.emailed_at && (
                                <div>
                                    <p className="text-sm text-gray-600">Email Status</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge color="success" size="sm" startIcon={<Mail />}>
                                            Sent
                                        </Badge>
                                        <span className="text-sm text-gray-600">
                                            {new Date(receipt.emailed_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {receipt.emailed_to && (
                                        <p className="text-sm text-gray-600 mt-1">To: {receipt.emailed_to}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Email Receipt</h2>
                        {!showEmailForm && (
                            <Button
                                variant="outline"
                                onClick={() => setShowEmailForm(true)}
                                startIcon={<Mail />}
                            >
                                Send Email
                            </Button>
                        )}
                    </div>

                    {showEmailForm ? (
                        <Form
                            action={ReceiptController.email.url({ receipt: receipt.id })}
                            method="post"
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email">
                                            Email Address <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="customer@example.com"
                                            defaultValue={receipt.customer?.email || ''}
                                            error={!!errors.email}
                                            required
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit" variant="primary" disabled={processing} loading={processing} startIcon={<Mail />}>
                                            Send Receipt
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowEmailForm(false)}
                                            disabled={processing}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Click "Send Email" to email this receipt to a customer</p>
                        </div>
                    )}
                </Card>

                {receipt.order && receipt.order.items && receipt.order.items.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Order Items
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Price
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {receipt.order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {item.product_variant?.product?.name || 'Item'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                {formatCurrency(item.total_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                            Total
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                            {formatCurrency(receipt.order.total_amount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default Show;
