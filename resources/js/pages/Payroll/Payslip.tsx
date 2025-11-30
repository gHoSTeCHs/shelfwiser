import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import { ArrowLeft, Download, Building2, User, Calendar, DollarSign } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Shop {
    id: number;
    name: string;
}

interface PayrollPeriod {
    id: number;
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
    status: string;
}

interface Payslip {
    id: number;
    base_salary: string;
    regular_hours: string;
    regular_pay: string;
    overtime_hours: string;
    overtime_pay: string;
    bonus: string;
    commission: string;
    gross_pay: string;
    income_tax: string;
    pension_employee: string;
    pension_employer: string;
    nhf: string;
    nhis: string;
    wage_advance_deduction: string;
    other_deductions: string;
    total_deductions: string;
    net_pay: string;
    earnings_breakdown?: any;
    deductions_breakdown?: any;
    tax_breakdown?: any;
    user: User;
    shop?: Shop;
    payroll_period: PayrollPeriod;
}

interface Props {
    payslip: Payslip;
}

export default function Payslip({ payslip }: Props) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(parseFloat(amount.toString()));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'approved':
                return 'success';
            case 'processed':
                return 'info';
            case 'cancelled':
                return 'error';
            default:
                return 'light';
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout>
            <Head title={`Payslip - ${payslip.payroll_period.period_name}`} />

            <div className="mb-6 print:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() => router.visit(PayrollController.myPayslips.url())}
                    className="mb-4"
                >
                    Back to My Payslips
                </Button>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900">Payslip</h1>
                        <p className="mt-1 text-sm text-dark-600">
                            {payslip.payroll_period.period_name}
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="md"
                        startIcon={<Download className="h-4 w-4" />}
                        onClick={handlePrint}
                    >
                        Download / Print
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-dark-200 bg-dark-50 p-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-dark-900">
                                Employee Information
                            </h2>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-dark-400" />
                                    <span className="font-medium text-dark-900">
                                        {payslip.user.name}
                                    </span>
                                </div>
                                <div className="text-sm text-dark-600">
                                    {payslip.user.email}
                                </div>
                                {payslip.shop && (
                                    <div className="flex items-center gap-2 text-sm text-dark-600">
                                        <Building2 className="h-4 w-4 text-dark-400" />
                                        {payslip.shop.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-dark-900">
                                Pay Period
                            </h2>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-dark-400" />
                                    <span className="text-dark-900">
                                        {formatDate(payslip.payroll_period.start_date)} -{' '}
                                        {formatDate(payslip.payroll_period.end_date)}
                                    </span>
                                </div>
                                <div className="text-sm text-dark-600">
                                    Payment Date:{' '}
                                    {formatDate(payslip.payroll_period.payment_date)}
                                </div>
                                <div>
                                    <Badge
                                        color={getStatusColor(payslip.payroll_period.status)}
                                        size="sm"
                                    >
                                        {payslip.payroll_period.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                            <h3 className="mb-4 text-base font-semibold text-dark-900">
                                Earnings
                            </h3>
                            <div className="space-y-3 rounded-lg border border-dark-200 bg-dark-50 p-4">
                                {parseFloat(payslip.base_salary) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">Base Salary</span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.base_salary)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.regular_hours) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">
                                            Regular Pay ({parseFloat(payslip.regular_hours).toFixed(2)}{' '}
                                            hours)
                                        </span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.regular_pay)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.overtime_hours) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">
                                            Overtime Pay ({parseFloat(payslip.overtime_hours).toFixed(2)}{' '}
                                            hours)
                                        </span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.overtime_pay)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.bonus) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">Bonus</span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.bonus)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.commission) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">Commission</span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.commission)}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-dark-300 pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-dark-900">
                                            Gross Pay
                                        </span>
                                        <span className="text-lg font-bold text-dark-900">
                                            {formatCurrency(payslip.gross_pay)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-base font-semibold text-dark-900">
                                Deductions
                            </h3>
                            <div className="space-y-3 rounded-lg border border-dark-200 bg-dark-50 p-4">
                                {parseFloat(payslip.income_tax) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">Income Tax (PAYE)</span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.income_tax)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.pension_employee) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">
                                            Pension (Employee Contribution)
                                        </span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.pension_employee)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.nhf) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">
                                            National Housing Fund (NHF)
                                        </span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.nhf)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.nhis) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">
                                            Health Insurance (NHIS)
                                        </span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.nhis)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.wage_advance_deduction) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">Wage Advance Repayment</span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.wage_advance_deduction)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.other_deductions) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-600">Other Deductions</span>
                                        <span className="font-medium text-dark-900">
                                            {formatCurrency(payslip.other_deductions)}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-dark-300 pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-dark-900">
                                            Total Deductions
                                        </span>
                                        <span className="text-lg font-bold text-warning-600">
                                            {formatCurrency(payslip.total_deductions)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {parseFloat(payslip.pension_employer) > 0 && (
                        <div className="mt-6">
                            <h3 className="mb-4 text-base font-semibold text-dark-900">
                                Employer Contributions
                            </h3>
                            <div className="rounded-lg border border-dark-200 bg-brand-50 p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-600">
                                        Pension (Employer Contribution)
                                    </span>
                                    <span className="font-medium text-dark-900">
                                        {formatCurrency(payslip.pension_employer)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 border-t border-dark-200 pt-6">
                        <div className="flex items-center justify-between rounded-lg bg-success-50 p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-success-100 p-3">
                                    <DollarSign className="h-6 w-6 text-success-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-dark-600">Net Pay</p>
                                    <p className="text-3xl font-bold text-success-600">
                                        {formatCurrency(payslip.net_pay)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-dark-500">Amount to be paid</p>
                                <p className="text-sm font-medium text-dark-600">
                                    on {formatDate(payslip.payroll_period.payment_date)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-dark-200 pt-6">
                        <p className="text-xs text-dark-500">
                            This is a computer-generated payslip. For any queries regarding your
                            payslip, please contact your manager or the HR department.
                        </p>
                    </div>
                </div>
            </Card>
        </AppLayout>
    );
}
