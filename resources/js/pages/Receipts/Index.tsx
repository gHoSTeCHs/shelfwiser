import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import { Receipt, FileText, Download, Mail, Search } from 'lucide-react';
import ReceiptController from '@/actions/App/Http/Controllers/ReceiptController';
import { ReceiptsIndexProps } from '@/types/receipt';

/**
 * Receipt list page showing all generated receipts.
 * Supports search, filtering by type, and pagination.
 */
const Index: React.FC<ReceiptsIndexProps> = ({ receipts, filters, stats }) => {
    const [search, setSearch] = React.useState(filters.search || '');
    const [type, setType] = React.useState(filters.type || '');

    const handleSearch = () => {
        router.get(
            ReceiptController.index.url(),
            { search, type },
            { preserveState: true }
        );
    };

    const getReceiptTypeBadge = (receiptType: string) => {
        return receiptType === 'order' ? (
            <Badge color="primary" size="sm">
                Order
            </Badge>
        ) : (
            <Badge color="success" size="sm">
                Payment
            </Badge>
        );
    };

    return (
        <AppLayout>
            <Head title="Receipts" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Receipts</p>
                                <p className="text-3xl font-bold mt-2">{stats.total_receipts}</p>
                            </div>
                            <div className="bg-brand-100 p-3 rounded-full">
                                <Receipt className="w-8 h-8 text-brand-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Order Receipts</p>
                                <p className="text-3xl font-bold mt-2">{stats.order_receipts}</p>
                            </div>
                            <div className="bg-info-100 p-3 rounded-full">
                                <FileText className="w-8 h-8 text-info-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Payment Receipts</p>
                                <p className="text-3xl font-bold mt-2">{stats.payment_receipts}</p>
                            </div>
                            <div className="bg-success-100 p-3 rounded-full">
                                <Receipt className="w-8 h-8 text-success-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search by receipt number or customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                options={[
                                    { value: '', label: 'All Types' },
                                    { value: 'order', label: 'Order Receipts' },
                                    { value: 'payment', label: 'Payment Receipts' },
                                ]}
                                value={type}
                                onChange={(value) => setType(value)}
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleSearch}
                            startIcon={<Search />}
                        >
                            Search
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Receipt #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Generated
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {receipts.data.map((receipt) => (
                                    <tr key={receipt.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">
                                                {receipt.receipt_number}
                                            </div>
                                            {receipt.emailed_at && (
                                                <div className="flex items-center gap-1 text-xs text-success-600 mt-1">
                                                    <Mail className="w-3 h-3" />
                                                    Emailed
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getReceiptTypeBadge(receipt.type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {receipt.order?.order_number || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {receipt.customer
                                                    ? `${receipt.customer.first_name} ${receipt.customer.last_name}`
                                                    : 'N/A'}
                                            </div>
                                            {receipt.customer?.email && (
                                                <div className="text-xs text-gray-500">
                                                    {receipt.customer.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {receipt.shop?.currency_symbol}
                                                {parseFloat(receipt.amount.toString()).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(receipt.generated_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(receipt.generated_at).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={ReceiptController.show.url({ receipt: receipt.id })}
                                                >
                                                    <Button variant="outline" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                                {receipt.type === 'order' && receipt.order_id && (
                                                    <a
                                                        href={ReceiptController.orders.download.url({
                                                            order: receipt.order_id,
                                                        })}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            startIcon={<Download />}
                                                        >
                                                            PDF
                                                        </Button>
                                                    </a>
                                                )}
                                                {receipt.type === 'payment' && receipt.order_payment_id && (
                                                    <a
                                                        href={ReceiptController.payments.download.url({
                                                            payment: receipt.order_payment_id,
                                                        })}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            startIcon={<Download />}
                                                        >
                                                            PDF
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {receipts.data.length === 0 && (
                        <div className="text-center py-12">
                            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No receipts found.</p>
                        </div>
                    )}

                    {receipts.last_page > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex gap-2">
                                {Array.from({ length: receipts.last_page }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === receipts.current_page ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                ReceiptController.index.url(),
                                                { ...filters, page },
                                                { preserveState: true }
                                            )
                                        }
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
};

export default Index;
