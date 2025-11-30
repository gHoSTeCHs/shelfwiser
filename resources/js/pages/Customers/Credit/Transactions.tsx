import CustomerCreditController from '@/actions/App/Http/Controllers/CustomerCreditController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import Select from '@/components/form/Select';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    FileText,
    User,
    Calendar,
    Filter,
} from 'lucide-react';
import { useState } from 'react';

interface Shop {
    id: number;
    name: string;
    currency_symbol?: string;
}

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface User {
    id: number;
    name: string;
}

interface Order {
    id: number;
    order_number: string;
}

interface Transaction {
    id: number;
    type: string;
    amount: number;
    payment_method: string | null;
    reference_number: string | null;
    notes: string | null;
    balance_before: number;
    balance_after: number;
    created_at: string;
    order?: Order;
    recorded_by?: User;
}

interface Props {
    shop: Shop;
    customer: Customer;
    transactions: {
        data: Transaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        type?: string;
    };
}

export default function Transactions({
    shop,
    customer,
    transactions,
    filters,
}: Props) {
    const currencySymbol = shop.currency_symbol || '$';
    const [typeFilter, setTypeFilter] = useState(filters.type || '');

    const typeOptions = [
        { value: '', label: 'All Transactions' },
        { value: 'charge', label: 'Charges Only' },
        { value: 'payment', label: 'Payments Only' },
    ];

    const handleFilterChange = (type: string) => {
        setTypeFilter(type);
        router.get(
            CustomerCreditController.transactions.url({
                shop: shop.id,
                customer: customer.id,
            }),
            { type: type || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const getTransactionTypeColor = (type: string) => {
        return type === 'charge' ? 'error' : 'success';
    };

    const getTransactionTypeIcon = (type: string) => {
        return type === 'charge' ? (
            <TrendingUp className="h-4 w-4" />
        ) : (
            <TrendingDown className="h-4 w-4" />
        );
    };

    return (
        <AppLayout>
            <Head
                title={`Transactions - ${customer.first_name} ${customer.last_name}`}
            />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={CustomerCreditController.show.url({
                                shop: shop.id,
                                customer: customer.id,
                            })}
                        >
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Summary
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Transaction History
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {customer.first_name} {customer.last_name}
                            </p>
                        </div>
                    </div>
                </div>

                <Card>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Filter by type:
                            </p>
                        </div>
                        <div className="w-full sm:w-64">
                            <Select
                                options={typeOptions}
                                value={typeFilter}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    {transactions.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                                No transactions found
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {typeFilter
                                    ? 'Try adjusting your filters'
                                    : 'This customer has no credit transactions yet'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {transactions.data.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`rounded-full p-2 ${
                                                        transaction.type ===
                                                        'charge'
                                                            ? 'bg-error-50 dark:bg-error-950/50'
                                                            : 'bg-success-50 dark:bg-success-950/50'
                                                    }`}
                                                >
                                                    <Badge
                                                        color={getTransactionTypeColor(
                                                            transaction.type,
                                                        )}
                                                    >
                                                        {getTransactionTypeIcon(
                                                            transaction.type,
                                                        )}
                                                    </Badge>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {transaction.type ===
                                                            'charge'
                                                                ? 'Charge'
                                                                : 'Payment'}
                                                        </p>
                                                        {transaction.payment_method && (
                                                            <Badge
                                                                color="light"
                                                                size="sm"
                                                            >
                                                                {transaction.payment_method
                                                                    .replace(
                                                                        '_',
                                                                        ' ',
                                                                    )
                                                                    .replace(
                                                                        /\b\w/g,
                                                                        (l) =>
                                                                            l.toUpperCase(),
                                                                    )}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(
                                                                transaction.created_at,
                                                            ).toLocaleString()}
                                                        </div>

                                                        {transaction.order && (
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                                <FileText className="h-3.5 w-3.5" />
                                                                Order #
                                                                {
                                                                    transaction
                                                                        .order
                                                                        .order_number
                                                                }
                                                            </div>
                                                        )}

                                                        {transaction.recorded_by && (
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                                <User className="h-3.5 w-3.5" />
                                                                {
                                                                    transaction
                                                                        .recorded_by
                                                                        .name
                                                                }
                                                            </div>
                                                        )}

                                                        {transaction.reference_number && (
                                                            <p className="text-gray-600 dark:text-gray-400">
                                                                Ref:{' '}
                                                                {
                                                                    transaction.reference_number
                                                                }
                                                            </p>
                                                        )}

                                                        {transaction.notes && (
                                                            <p className="text-gray-600 dark:text-gray-400">
                                                                {
                                                                    transaction.notes
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 text-right">
                                                <p
                                                    className={`mb-1 text-lg font-bold ${
                                                        transaction.type ===
                                                        'charge'
                                                            ? 'text-error-600 dark:text-error-400'
                                                            : 'text-success-600 dark:text-success-400'
                                                    }`}
                                                >
                                                    {transaction.type ===
                                                    'charge'
                                                        ? '+'
                                                        : '-'}
                                                    {currencySymbol}
                                                    {transaction.amount.toFixed(
                                                        2,
                                                    )}
                                                </p>
                                                <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-500">
                                                    <p>
                                                        Before:{' '}
                                                        {currencySymbol}
                                                        {transaction.balance_before.toFixed(
                                                            2,
                                                        )}
                                                    </p>
                                                    <p>
                                                        After: {currencySymbol}
                                                        {transaction.balance_after.toFixed(
                                                            2,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {transactions.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing {transactions.data.length} of{' '}
                                        {transactions.total} transactions
                                    </div>
                                    <div className="flex gap-2">
                                        {transactions.links.map(
                                            (link, index) => {
                                                if (
                                                    !link.url ||
                                                    link.label === '...'
                                                )
                                                    return (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 text-sm text-gray-400"
                                                        >
                                                            {link.label
                                                                .replace(
                                                                    '&laquo; Previous',
                                                                    '‹',
                                                                )
                                                                .replace(
                                                                    'Next &raquo;',
                                                                    '›',
                                                                )}
                                                        </span>
                                                    );

                                                return (
                                                    <Link
                                                        key={index}
                                                        href={link.url}
                                                        preserveState
                                                        preserveScroll
                                                    >
                                                        <Button
                                                            variant={
                                                                link.active
                                                                    ? 'primary'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                        >
                                                            {link.label
                                                                .replace(
                                                                    '&laquo; Previous',
                                                                    '‹',
                                                                )
                                                                .replace(
                                                                    'Next &raquo;',
                                                                    '›',
                                                                )}
                                                        </Button>
                                                    </Link>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

Transactions.layout = (page: React.ReactNode) => page;
