import PayrollController from '@/actions/App/Http/Controllers/PayrollController.ts';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { formatDateLong } from '@/lib/formatters';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, DollarSign } from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface Props {
    shops: Shop[];
}

const PayrollCreate = ({ shops }: Props) => {
    const [shopId, setShopId] = useState('');
    const [periodName, setPeriodName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentDate, setPaymentDate] = useState('');

    const generatePeriodName = () => {
        if (startDate && endDate) {
            const formattedDate = formatDateLong(startDate);
            const monthYear = formattedDate.split(' ').slice(0, 2).join(' ');
            setPeriodName(`${monthYear} Payroll`);
        }
    };

    React.useEffect(() => {
        if (startDate && endDate && !periodName) {
            generatePeriodName();
        }
    }, [startDate, endDate]);

    return (
        <>
            <Head title="Create Payroll Period" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={PayrollController.index.url()}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create Payroll Period
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Set up a new payroll period for employee payments
                        </p>
                    </div>
                </div>

                <Form action={PayrollController.store.url()} method="post">
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                                    Period Details
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="shop_id">Shop</Label>
                                        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                            Leave empty to process payroll for
                                            all shops
                                        </p>
                                        <select
                                            id="shop_id"
                                            name="shop_id"
                                            value={shopId}
                                            onChange={(e) =>
                                                setShopId(e.target.value)
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        >
                                            <option value="">All Shops</option>
                                            {shops.map((shop) => (
                                                <option
                                                    key={shop.id}
                                                    value={shop.id}
                                                >
                                                    {shop.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.shop_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="period_name">
                                            Period Name
                                        </Label>
                                        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                            Leave empty to auto-generate from
                                            dates
                                        </p>
                                        <Input
                                            type="text"
                                            id="period_name"
                                            name="period_name"
                                            value={periodName}
                                            onChange={(e) =>
                                                setPeriodName(e.target.value)
                                            }
                                            placeholder="e.g., December 2025 Payroll"
                                            error={!!errors.period_name}
                                        />
                                        <InputError
                                            message={errors.period_name}
                                        />
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="start_date">
                                                Start Date{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <div className="relative mt-2">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <Calendar className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Input
                                                    type="date"
                                                    id="start_date"
                                                    name="start_date"
                                                    value={startDate}
                                                    onChange={(e) =>
                                                        setStartDate(
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={!!errors.start_date}
                                                    required
                                                    className="pl-10"
                                                />
                                            </div>
                                            <InputError
                                                message={errors.start_date}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="end_date">
                                                End Date{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <div className="relative mt-2">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <Calendar className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Input
                                                    type="date"
                                                    id="end_date"
                                                    name="end_date"
                                                    value={endDate}
                                                    onChange={(e) =>
                                                        setEndDate(
                                                            e.target.value,
                                                        )
                                                    }
                                                    min={startDate}
                                                    error={!!errors.end_date}
                                                    required
                                                    className="pl-10"
                                                />
                                            </div>
                                            <InputError
                                                message={errors.end_date}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="payment_date">
                                            Payment Date{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                            Date when employees will receive
                                            payment
                                        </p>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <DollarSign className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                type="date"
                                                id="payment_date"
                                                name="payment_date"
                                                value={paymentDate}
                                                onChange={(e) =>
                                                    setPaymentDate(
                                                        e.target.value,
                                                    )
                                                }
                                                min={endDate}
                                                error={!!errors.payment_date}
                                                required
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError
                                            message={errors.payment_date}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                    <h3 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-300">
                                        Important Information
                                    </h3>
                                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
                                        <li>
                                            • Payroll will be calculated based
                                            on employee salary configurations
                                        </li>
                                        <li>
                                            • Deductions and wage advances will
                                            be automatically applied
                                        </li>
                                        <li>
                                            • You can review and modify payslips
                                            before approval
                                        </li>
                                    </ul>
                                </div>
                            </Card>

                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    loading={processing}
                                    className="flex-1"
                                >
                                    Create Payroll Period
                                </Button>
                                <Link href={PayrollController.index.url()}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
};

PayrollCreate.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default PayrollCreate;
