import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, FileText } from 'lucide-react';

interface PayrollPeriod {
    id: number;
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
    status: string;
}

interface Shop {
    id: number;
    name: string;
}

interface Payslip {
    id: number;
    gross_pay: string;
    total_deductions: string;
    net_pay: string;
    basic_salary: string;
    regular_hours: string;
    regular_pay: string;
    overtime_hours: string;
    overtime_pay: string;
    payroll_period: PayrollPeriod;
    shop?: Shop;
}

interface Props {
    payslips: Payslip[];
}

export default function MyPayslips({ payslips }: Props) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(parseFloat(amount.toString()));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'light';
            case 'processing':
                return 'warning';
            case 'processed':
                return 'info';
            case 'approved':
                return 'success';
            case 'paid':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'light';
        }
    };

    const totalGrossPay = payslips.reduce(
        (sum, payslip) => sum + parseFloat(payslip.gross_pay),
        0,
    );
    const totalNetPay = payslips.reduce(
        (sum, payslip) => sum + parseFloat(payslip.net_pay),
        0,
    );

    return (
        <>
            <Head title="My Payslips" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Payslips
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    View your payment history and payslip details
                </p>
            </div>

            {payslips.length > 0 && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <Card className="p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Gross Pay (All Time)
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(totalGrossPay)}
                            </p>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Net Pay (All Time)
                            </p>
                            <p className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">
                                {formatCurrency(totalNetPay)}
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            <Card className="overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Payslip History
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    {payslips.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                icon={<FileText />}
                                title="No payslips found"
                                description="You don't have any payslips yet. Payslips will appear here once payroll has been processed."
                            />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Period
                                </th>
                                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Shop
                                </th>
                                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Payment Date
                                </th>
                                <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Hours
                                </th>
                                <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Gross Pay
                                </th>
                                <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Deductions
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Net Pay
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                            {payslips.map((payslip) => (
                                <tr
                                    key={payslip.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {
                                                        payslip.payroll_period
                                                            .period_name
                                                    }
                                                </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(
                                                        payslip.payroll_period
                                                            .start_date,
                                                    )}{' '}
                                                -{' '}
                                                {formatDate(
                                                    payslip.payroll_period
                                                        .end_date,
                                                )}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {payslip.shop
                                            ? payslip.shop.name
                                            : 'N/A'}
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                            {formatDate(
                                                payslip.payroll_period
                                                    .payment_date,
                                            )}
                                        </div>
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                        <div className="flex flex-col">
                                                <span>
                                                    {parseFloat(
                                                        payslip.regular_hours,
                                                    ).toFixed(2)}
                                                    h
                                                </span>
                                            {parseFloat(
                                                payslip.overtime_hours,
                                            ) > 0 && (
                                                <span className="text-xs text-warning-600 dark:text-warning-400">
                                                        +
                                                    {parseFloat(
                                                        payslip.overtime_hours,
                                                    ).toFixed(2)}
                                                    h OT
                                                    </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(payslip.gross_pay)}
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-3 text-right text-sm text-warning-600 dark:text-warning-400">
                                        {formatCurrency(
                                            payslip.total_deductions,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                        {formatCurrency(payslip.net_pay)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            color={getStatusColor(
                                                payslip.payroll_period
                                                    .status,
                                            )}
                                            size="sm"
                                        >
                                            {payslip.payroll_period.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={PayrollController.showPayslip.url(
                                                {
                                                    payslip: payslip.id,
                                                },
                                            )}
                                            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </>
    );
}

MyPayslips.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
