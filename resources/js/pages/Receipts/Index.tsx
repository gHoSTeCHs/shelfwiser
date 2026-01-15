import ReceiptController from '@/actions/App/Http/Controllers/ReceiptController';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { ReceiptsIndexProps } from '@/types/receipt';
import { Head, Link, router } from '@inertiajs/react';
import { Download, FileText, Mail, Receipt, Search } from 'lucide-react';
import React from 'react';

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
            { preserveState: true },
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
        <>
            <Head title="Receipts" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Receipts
                    </h1>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Receipts
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {stats.total_receipts}
                                </p>
                            </div>
                            <div className="rounded-full bg-brand-100 p-3">
                                <Receipt className="h-8 w-8 text-brand-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Order Receipts
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {stats.order_receipts}
                                </p>
                            </div>
                            <div className="bg-info-100 rounded-full p-3">
                                <FileText className="text-info-600 h-8 w-8" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Payment Receipts
                                </p>
                                <p className="mt-2 text-3xl font-bold">
                                    {stats.payment_receipts}
                                </p>
                            </div>
                            <div className="rounded-full bg-success-100 p-3">
                                <Receipt className="h-8 w-8 text-success-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search by receipt number or customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleSearch()
                                }
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                options={[
                                    { value: '', label: 'All Types' },
                                    { value: 'order', label: 'Order Receipts' },
                                    {
                                        value: 'payment',
                                        label: 'Payment Receipts',
                                    },
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
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Receipt #
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Order #
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Generated
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {receipts.data.map((receipt) => (
                                    <tr
                                        key={receipt.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">
                                                {receipt.receipt_number}
                                            </div>
                                            {receipt.emailed_at && (
                                                <div className="mt-1 flex items-center gap-1 text-xs text-success-600">
                                                    <Mail className="h-3 w-3" />
                                                    Emailed
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getReceiptTypeBadge(receipt.type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {receipt.order?.order_number ||
                                                    'N/A'}
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
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {receipt.shop?.currency_symbol}
                                                {parseFloat(
                                                    receipt.amount.toString(),
                                                ).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(
                                                    receipt.generated_at,
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(
                                                    receipt.generated_at,
                                                ).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={ReceiptController.show.url(
                                                        { receipt: receipt.id },
                                                    )}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        View
                                                    </Button>
                                                </Link>
                                                {receipt.type === 'order' &&
                                                    receipt.order_id && (
                                                        <a
                                                            href={ReceiptController.orders.download.url(
                                                                {
                                                                    order: receipt.order_id,
                                                                },
                                                            )}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                startIcon={
                                                                    <Download />
                                                                }
                                                            >
                                                                PDF
                                                            </Button>
                                                        </a>
                                                    )}
                                                {receipt.type === 'payment' &&
                                                    receipt.order_payment_id && (
                                                        <a
                                                            href={ReceiptController.payments.download.url(
                                                                {
                                                                    payment:
                                                                        receipt.order_payment_id,
                                                                },
                                                            )}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                startIcon={
                                                                    <Download />
                                                                }
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
                        <div className="py-12 text-center">
                            <Receipt className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                            <p className="text-gray-500">No receipts found.</p>
                        </div>
                    )}

                    {receipts.last_page > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex gap-2">
                                {Array.from(
                                    { length: receipts.last_page },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <Button
                                        key={page}
                                        variant={
                                            page === receipts.current_page
                                                ? 'primary'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                ReceiptController.index.url(),
                                                { ...filters, page },
                                                { preserveState: true },
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
        </>
    );
};

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default Index;
