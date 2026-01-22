import WageAdvanceController from '@/actions/App/Http/Controllers/WageAdvanceController.ts';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { calculateInstallmentAmount } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { Form, Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    DollarSign,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface Eligibility {
    eligible: boolean;
    reason: string | null;
    max_amount: number;
    available_amount: number;
    percentage_allowed: number;
    active_advances: number;
    estimated_monthly_pay: number;
}

interface Props {
    shop: Shop;
    eligibility: Eligibility;
}

const WageAdvancesCreate = ({ shop, eligibility }: Props) => {
    const [amountRequested, setAmountRequested] = useState('');
    const [reason, setReason] = useState('');
    const [repaymentInstallments, setRepaymentInstallments] = useState('3');

    const installmentAmount = calculateInstallmentAmount(
        parseFloat(amountRequested) || 0,
        parseInt(repaymentInstallments) || 1,
    );

    return (
        <>
            <Head title="Request Wage Advance" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={WageAdvanceController.index.url()}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Request Wage Advance
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Request an advance on your upcoming salary
                        </p>
                    </div>
                </div>

                {!eligibility.eligible ? (
                    <Card className="border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
                        <div className="flex items-start gap-3">
                            <XCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
                            <div>
                                <h3 className="font-semibold text-error-900 dark:text-error-100">
                                    Not Eligible
                                </h3>
                                <p className="mt-1 text-sm text-error-700 dark:text-error-300">
                                    {eligibility.reason}
                                </p>
                                <Link
                                    href={WageAdvanceController.index.url()}
                                    className="mt-3 inline-block"
                                >
                                    <Button variant="outline" size="sm">
                                        Back to Wage Advances
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        <Card className="border-success-200 bg-success-50 p-6 dark:border-success-800 dark:bg-success-900/20">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-success-900 dark:text-success-100">
                                        You're Eligible!
                                    </h3>
                                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                                        <div>
                                            <p className="text-sm text-success-700 dark:text-success-300">
                                                Available Amount
                                            </p>
                                            <p className="text-lg font-bold text-success-900 dark:text-success-100">
                                                {formatCurrency(
                                                    eligibility.available_amount,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-success-700 dark:text-success-300">
                                                Maximum Percentage
                                            </p>
                                            <p className="text-lg font-bold text-success-900 dark:text-success-100">
                                                {eligibility.percentage_allowed}
                                                %
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-success-700 dark:text-success-300">
                                                Estimated Monthly Pay
                                            </p>
                                            <p className="text-lg font-bold text-success-900 dark:text-success-100">
                                                {formatCurrency(
                                                    eligibility.estimated_monthly_pay,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Form
                            action={WageAdvanceController.store.url()}
                            method="post"
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-6">
                                    <Card className="p-6">
                                        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                                            Request Details
                                        </h2>

                                        <input
                                            type="hidden"
                                            name="shop_id"
                                            value={shop.id}
                                        />

                                        <div className="space-y-6">
                                            <div>
                                                <Label htmlFor="amount_requested">
                                                    Amount Requested{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                                    Maximum available:{' '}
                                                    {formatCurrency(
                                                        eligibility.available_amount,
                                                    )}
                                                </p>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <DollarSign className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        id="amount_requested"
                                                        name="amount_requested"
                                                        value={amountRequested}
                                                        onChange={(e) =>
                                                            setAmountRequested(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={
                                                            eligibility.available_amount
                                                        }
                                                        error={
                                                            !!errors.amount_requested
                                                        }
                                                        required
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <InputError
                                                    message={
                                                        errors.amount_requested
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="repayment_installments">
                                                    Repayment Period{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                                    Number of months to repay
                                                    (1-12)
                                                </p>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <Calendar className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        id="repayment_installments"
                                                        name="repayment_installments"
                                                        value={
                                                            repaymentInstallments
                                                        }
                                                        onChange={(e) =>
                                                            setRepaymentInstallments(
                                                                e.target.value,
                                                            )
                                                        }
                                                        min="1"
                                                        max="12"
                                                        error={
                                                            !!errors.repayment_installments
                                                        }
                                                        required
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <InputError
                                                    message={
                                                        errors.repayment_installments
                                                    }
                                                />
                                                {amountRequested &&
                                                    repaymentInstallments && (
                                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                            Monthly deduction:{' '}
                                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                                {formatCurrency(
                                                                    installmentAmount,
                                                                )}
                                                            </span>
                                                        </p>
                                                    )}
                                            </div>

                                            <div>
                                                <Label htmlFor="reason">
                                                    Reason (Optional)
                                                </Label>
                                                <TextArea
                                                    id="reason"
                                                    name="reason"
                                                    value={reason}
                                                    onChange={(value) =>
                                                        setReason(value)
                                                    }
                                                    rows={4}
                                                    error={!!errors.reason}
                                                    hint="Briefly describe why you need this advance"
                                                />
                                                <InputError
                                                    message={errors.reason}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                                    <p className="font-medium">
                                                        Important Information
                                                    </p>
                                                    <ul className="mt-2 space-y-1">
                                                        <li>
                                                            • Your request will
                                                            be reviewed by
                                                            management
                                                        </li>
                                                        <li>
                                                            • Deductions will
                                                            start after approval
                                                            and disbursement
                                                        </li>
                                                        <li>
                                                            • Monthly deductions
                                                            will be taken from
                                                            your salary
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="flex gap-4">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            loading={processing}
                                            className="flex-1"
                                        >
                                            Submit Request
                                        </Button>
                                        <Link
                                            href={WageAdvanceController.index.url()}
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </>
                )}
            </div>
        </>
    );
};

WageAdvancesCreate.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default WageAdvancesCreate;
