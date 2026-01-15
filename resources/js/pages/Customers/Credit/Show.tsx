import CustomerCreditController from '@/actions/App/Http/Controllers/CustomerCreditController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    DollarSign,
    FileText,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

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
    phone: string | null;
    account_balance: number;
    credit_limit: number;
    total_purchases: number;
    is_active: boolean;
}

interface Transaction {
    id: number;
    type: string;
    amount: number;
    payment_method: string | null;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
}

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
}

interface Summary {
    available_credit: number;
    credit_usage_percent: number;
    unpaid_orders: Order[];
    recent_transactions: Transaction[];
    total_purchases_amount: number;
    total_payments_amount: number;
}

interface Props {
    shop: Shop;
    customer: Customer;
    summary: Summary;
}

export default function Show({ shop, customer, summary }: Props) {
    const currencySymbol = shop.currency_symbol || '$';

    const getCreditStatus = () => {
        const usage = summary.credit_usage_percent;
        if (usage >= 90) return { color: 'error' as const, label: 'Critical' };
        if (usage >= 75) return { color: 'warning' as const, label: 'High' };
        if (usage >= 50) return { color: 'info' as const, label: 'Moderate' };
        return { color: 'success' as const, label: 'Good' };
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

    const creditStatus = getCreditStatus();

    return (
        <AppLayout>
            <Head
                title={`Credit Account - ${customer.first_name} ${customer.last_name}`}
            />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={CustomerCreditController.index.url({
                                shop: shop.id,
                            })}
                        >
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Customers
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {customer.first_name} {customer.last_name}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {customer.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={CustomerCreditController.createPayment.url({
                                shop: shop.id,
                                customer: customer.id,
                            })}
                        >
                            <Button>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Record Payment
                            </Button>
                        </Link>
                        <Link
                            href={CustomerCreditController.transactions.url({
                                shop: shop.id,
                                customer: customer.id,
                            })}
                        >
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                View All Transactions
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card title="Credit Summary">
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="mb-2 flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-gray-400" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Credit Limit
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {currencySymbol}
                                            {customer.credit_limit.toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="mb-2 flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-error-500" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Current Balance
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold text-error-600 dark:text-error-400">
                                            {currencySymbol}
                                            {customer.account_balance.toFixed(
                                                2,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-950/50">
                                        <div className="mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-success-600 dark:text-success-400" />
                                            <p className="text-sm text-success-700 dark:text-success-300">
                                                Available Credit
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                                            {currencySymbol}
                                            {summary.available_credit.toFixed(
                                                2,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Credit Usage
                                            </p>
                                            <Badge color={creditStatus.color}>
                                                {creditStatus.label}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {summary.credit_usage_percent.toFixed(
                                                    1,
                                                )}
                                                %
                                            </p>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                                <div
                                                    className={`h-full transition-all ${
                                                        creditStatus.color ===
                                                        'error'
                                                            ? 'bg-error-500'
                                                            : creditStatus.color ===
                                                                'warning'
                                                              ? 'bg-warning-500'
                                                              : creditStatus.color ===
                                                                  'info'
                                                                ? 'bg-info-500'
                                                                : 'bg-success-500'
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(summary.credit_usage_percent, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {summary.unpaid_orders.length > 0 && (
                                    <div>
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                            Unpaid Orders (
                                            {summary.unpaid_orders.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {summary.unpaid_orders.map(
                                                (order) => (
                                                    <div
                                                        key={order.id}
                                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                Order #
                                                                {
                                                                    order.order_number
                                                                }
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                Status:{' '}
                                                                {order.status}
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {currencySymbol}
                                                            {order.total_amount.toFixed(
                                                                2,
                                                            )}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {summary.recent_transactions.length > 0 && (
                                    <div>
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                            Recent Transactions
                                        </h3>
                                        <div className="space-y-2">
                                            {summary.recent_transactions.map(
                                                (transaction) => (
                                                    <div
                                                        key={transaction.id}
                                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                                    >
                                                        <div className="flex items-center gap-3">
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
                                                                    size="sm"
                                                                >
                                                                    {getTransactionTypeIcon(
                                                                        transaction.type,
                                                                    )}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {transaction.type ===
                                                                    'charge'
                                                                        ? 'Charge'
                                                                        : 'Payment'}
                                                                    {transaction.payment_method &&
                                                                        ` - ${transaction.payment_method}`}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                                    {new Date(
                                                                        transaction.created_at,
                                                                    ).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p
                                                            className={`font-semibold ${
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
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Customer Information">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Name
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {customer.first_name}{' '}
                                        {customer.last_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Email
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {customer.email}
                                    </p>
                                </div>
                                {customer.phone && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Phone
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {customer.phone}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Status
                                    </p>
                                    <Badge
                                        color={
                                            customer.is_active
                                                ? 'success'
                                                : 'error'
                                        }
                                    >
                                        {customer.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        <Card title="Purchase Summary">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Purchases
                                    </p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {customer.total_purchases}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Purchase Amount
                                    </p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {currencySymbol}
                                        {summary.total_purchases_amount.toFixed(
                                            2,
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Payments
                                    </p>
                                    <p className="font-semibold text-success-600 dark:text-success-400">
                                        {currencySymbol}
                                        {summary.total_payments_amount.toFixed(
                                            2,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

Show.layout = (page: React.ReactNode) => page;
