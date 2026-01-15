import CustomerCreditController from '@/actions/App/Http/Controllers/CustomerCreditController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import AppLayout from '@/layouts/AppLayout';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, CreditCard, DollarSign, Receipt } from 'lucide-react';
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
    account_balance: number;
    credit_limit: number;
    credit_transactions?: CreditTransaction[];
}

interface CreditTransaction {
    id: number;
    type: string;
    amount: number;
    payment_method: string | null;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
}

interface Props {
    shop: Shop;
    customer: Customer;
}

export default function RecordPayment({ shop, customer }: Props) {
    const toast = useToast();
    const currencySymbol = shop.currency_symbol || '$';

    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');

    const paymentMethods = [
        { value: '', label: 'Select payment method' },
        { value: 'cash', label: 'Cash' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'mobile_money', label: 'Mobile Money' },
        { value: 'card', label: 'Card' },
    ];

    const availableCredit = customer.credit_limit - customer.account_balance;

    return (
        <AppLayout>
            <Head
                title={`Record Payment - ${customer.first_name} ${customer.last_name}`}
            />

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-4">
                    <Link
                        href={CustomerCreditController.show.url({
                            shop: shop.id,
                            customer: customer.id,
                        })}
                    >
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Record Payment
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {customer.first_name} {customer.last_name}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card title="Payment Details">
                            <Form
                                action={CustomerCreditController.storePayment.url(
                                    {
                                        shop: shop.id,
                                        customer: customer.id,
                                    },
                                )}
                                method="post"
                                onSuccess={() => {
                                    toast.success(
                                        'Payment recorded successfully',
                                    );
                                }}
                            >
                                {({ errors, processing }) => (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="amount">
                                                Payment Amount{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <DollarSign className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    name="amount"
                                                    id="amount"
                                                    value={amount}
                                                    onChange={(e) =>
                                                        setAmount(
                                                            e.target.value,
                                                        )
                                                    }
                                                    step="0.01"
                                                    min="0.01"
                                                    max={
                                                        customer.account_balance
                                                    }
                                                    placeholder="0.00"
                                                    className="pl-10"
                                                    error={!!errors.amount}
                                                    hint={`Maximum: ${currencySymbol}${customer.account_balance.toFixed(2)}`}
                                                />
                                            </div>
                                            <InputError
                                                message={errors.amount}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="payment_method">
                                                Payment Method{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Select
                                                options={paymentMethods}
                                                value={paymentMethod}
                                                onChange={setPaymentMethod}
                                            />
                                            <input
                                                type="hidden"
                                                name="payment_method"
                                                value={paymentMethod}
                                            />
                                            <InputError
                                                message={errors.payment_method}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="reference_number">
                                                Reference Number
                                            </Label>
                                            <Input
                                                type="text"
                                                name="reference_number"
                                                id="reference_number"
                                                value={referenceNumber}
                                                onChange={(e) =>
                                                    setReferenceNumber(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Transaction reference or receipt number"
                                                error={
                                                    !!errors.reference_number
                                                }
                                                hint="Optional transaction or receipt reference"
                                            />
                                            <InputError
                                                message={
                                                    errors.reference_number
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="notes">Notes</Label>
                                            <TextArea
                                                name="notes"
                                                id="notes"
                                                value={notes}
                                                onChange={setNotes}
                                                rows={3}
                                                placeholder="Additional notes about this payment (optional)"
                                                error={!!errors.notes}
                                            />
                                            <InputError
                                                message={errors.notes}
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                                            <Link
                                                href={CustomerCreditController.show.url(
                                                    {
                                                        shop: shop.id,
                                                        customer: customer.id,
                                                    },
                                                )}
                                            >
                                                <Button variant="outline">
                                                    Cancel
                                                </Button>
                                            </Link>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                loading={processing}
                                            >
                                                <Receipt className="mr-2 h-4 w-4" />
                                                Record Payment
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Account Summary">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Credit Limit
                                    </p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {currencySymbol}
                                        {customer.credit_limit.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Current Balance
                                    </p>
                                    <p className="font-semibold text-error-600 dark:text-error-400">
                                        {currencySymbol}
                                        {customer.account_balance.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Available Credit
                                    </p>
                                    <p className="font-semibold text-success-600 dark:text-success-400">
                                        {currencySymbol}
                                        {availableCredit.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {customer.credit_transactions &&
                            customer.credit_transactions.length > 0 && (
                                <Card title="Recent Transactions">
                                    <div className="space-y-3">
                                        {customer.credit_transactions.map(
                                            (transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                                >
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <Badge
                                                            color={
                                                                transaction.type ===
                                                                'charge'
                                                                    ? 'error'
                                                                    : 'success'
                                                            }
                                                            size="sm"
                                                        >
                                                            {transaction.type ===
                                                            'charge'
                                                                ? 'Charge'
                                                                : 'Payment'}
                                                        </Badge>
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
                                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                                        {new Date(
                                                            transaction.created_at,
                                                        ).toLocaleString()}
                                                    </p>
                                                    {transaction.payment_method && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {
                                                                transaction.payment_method
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </Card>
                            )}

                        <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-950/50">
                            <div className="flex items-start gap-3">
                                <CreditCard className="mt-1 h-5 w-5 text-brand-600 dark:text-brand-400" />
                                <div>
                                    <h4 className="font-medium text-brand-900 dark:text-brand-200">
                                        Recording Payments
                                    </h4>
                                    <p className="mt-1 text-sm text-brand-700 dark:text-brand-300">
                                        Payments will reduce the customer's
                                        outstanding balance and increase their
                                        available credit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

RecordPayment.layout = (page: React.ReactNode) => page;
