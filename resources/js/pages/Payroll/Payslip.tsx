import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDateLong, formatNumber, formatPercentage } from '@/lib/formatters';
import { getPayrollStatusColor } from '@/lib/status-configs';
import type { AppliedRelief, TaxLawVersion } from '@/types/payroll';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calculator,
    Calendar,
    CheckCircle,
    DollarSign,
    Download,
    Info,
    Receipt,
    User,
} from 'lucide-react';

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

interface TaxBreakdown {
    tax_law_version?: TaxLawVersion;
    tax_law_label?: string;
    gross_annual_income?: number;
    taxable_income?: number;
    total_reliefs?: number;
    annual_tax?: number;
    monthly_tax?: number;
    effective_rate?: number;
    is_exempt?: boolean;
    exemption_reason?: string;
    is_low_income_exempt?: boolean;
    reliefs_applied?: AppliedRelief[];
    cra_amount?: number;
    pension_relief?: number;
    rent_relief?: number;
}

interface Payslip {
    id: number;
    basic_salary: string;
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
    tax_breakdown?: TaxBreakdown;
    user: User;
    shop?: Shop;
    payroll_period: PayrollPeriod;
}

interface Props {
    payslip: Payslip;
}

export default function Payslip({ payslip }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const taxBreakdown = payslip.tax_breakdown;
    const isNTA2025 = taxBreakdown?.tax_law_version === 'nta_2025';
    const hasReliefsApplied =
        taxBreakdown?.reliefs_applied &&
        taxBreakdown.reliefs_applied.length > 0;

    return (
        <>
            <Head title={`Payslip - ${payslip.payroll_period.period_name}`} />

            <div className="mb-6 print:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() =>
                        router.visit(PayrollController.myPayslips.url())
                    }
                    className="mb-4"
                >
                    Back to My Payslips
                </Button>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Payslip
                            </h1>
                            {taxBreakdown?.tax_law_label && (
                                <Badge
                                    color={isNTA2025 ? 'info' : 'light'}
                                    size="sm"
                                >
                                    {taxBreakdown.tax_law_label}
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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

            {taxBreakdown?.is_low_income_exempt && (
                <Card className="mb-4 border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20 print:hidden">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
                        <div>
                            <p className="font-semibold text-success-800 dark:text-success-200">
                                Tax Exempt - Low Income
                            </p>
                            <p className="text-sm text-success-600 dark:text-success-400">
                                Annual income qualifies for low-income exemption
                                under NTA 2025
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Employee Information
                            </h2>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {payslip.user.name}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {payslip.user.email}
                                </div>
                                {payslip.shop && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Building2 className="h-4 w-4 text-gray-400" />
                                        {payslip.shop.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Pay Period
                            </h2>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-white">
                                        {formatDateLong(
                                            payslip.payroll_period.start_date,
                                        )}{' '}
                                        -{' '}
                                        {formatDateLong(
                                            payslip.payroll_period.end_date,
                                        )}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Payment Date:{' '}
                                    {formatDateLong(
                                        payslip.payroll_period.payment_date,
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        color={getPayrollStatusColor(
                                            payslip.payroll_period.status,
                                        )}
                                        size="sm"
                                    >
                                        {payslip.payroll_period.status}
                                    </Badge>
                                    {taxBreakdown?.tax_law_label && (
                                        <span className="hidden print:flex">
                                            <Badge
                                                color={
                                                    isNTA2025 ? 'info' : 'light'
                                                }
                                                size="sm"
                                            >
                                                {taxBreakdown.tax_law_label}
                                            </Badge>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                                Earnings
                            </h3>
                            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                {parseFloat(payslip.basic_salary) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Base Salary
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                payslip.basic_salary,
                                            )}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.regular_hours) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Regular Pay ({formatNumber(payslip.regular_hours, 2)} hours)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.regular_pay)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.overtime_hours) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Overtime Pay ({formatNumber(payslip.overtime_hours, 2)} hours)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.overtime_pay)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.bonus) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Bonus
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.bonus)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.commission) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Commission
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.commission)}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-gray-300 pt-3 dark:border-gray-600">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            Gross Pay
                                        </span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.gross_pay)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                                Deductions
                            </h3>
                            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                {parseFloat(payslip.income_tax) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Income Tax (PAYE)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.income_tax)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.pension_employee) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Pension (Employee Contribution)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                payslip.pension_employee,
                                            )}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.nhf) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            National Housing Fund (NHF)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.nhf)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.nhis) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Health Insurance (NHIS)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(payslip.nhis)}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.wage_advance_deduction) >
                                    0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Wage Advance Repayment
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                payslip.wage_advance_deduction,
                                            )}
                                        </span>
                                    </div>
                                )}

                                {parseFloat(payslip.other_deductions) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Other Deductions
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                payslip.other_deductions,
                                            )}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-gray-300 pt-3 dark:border-gray-600">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            Total Deductions
                                        </span>
                                        <span className="text-lg font-bold text-warning-600 dark:text-warning-400">
                                            {formatCurrency(
                                                payslip.total_deductions,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {taxBreakdown &&
                        taxBreakdown.total_reliefs &&
                        taxBreakdown.total_reliefs > 0 && (
                            <div className="mt-6">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                                    <Calculator className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    Tax Reliefs Applied
                                    {taxBreakdown.tax_law_label && (
                                        <Badge
                                            color={isNTA2025 ? 'info' : 'light'}
                                            size="sm"
                                        >
                                            {taxBreakdown.tax_law_label}
                                        </Badge>
                                    )}
                                </h3>
                                <div className="rounded-lg border border-gray-200 bg-success-50/50 p-4 dark:border-gray-700 dark:bg-success-900/10">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {taxBreakdown.cra_amount &&
                                            taxBreakdown.cra_amount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Consolidated Relief
                                                        Allowance (CRA)
                                                    </span>
                                                    <span className="font-medium text-success-600 dark:text-success-400">
                                                        {formatCurrency(
                                                            taxBreakdown.cra_amount,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        {taxBreakdown.pension_relief &&
                                            taxBreakdown.pension_relief > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Pension Relief
                                                    </span>
                                                    <span className="font-medium text-success-600 dark:text-success-400">
                                                        {formatCurrency(
                                                            taxBreakdown.pension_relief,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        {taxBreakdown.rent_relief &&
                                            taxBreakdown.rent_relief > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                        Rent Relief
                                                        <Badge
                                                            color="info"
                                                            size="sm"
                                                        >
                                                            NTA
                                                        </Badge>
                                                    </span>
                                                    <span className="font-medium text-success-600 dark:text-success-400">
                                                        {formatCurrency(
                                                            taxBreakdown.rent_relief,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        {hasReliefsApplied &&
                                            taxBreakdown.reliefs_applied?.map(
                                                (relief, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex justify-between text-sm"
                                                    >
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {relief.name}
                                                        </span>
                                                        <span className="font-medium text-success-600 dark:text-success-400">
                                                            {formatCurrency(
                                                                relief.amount,
                                                            )}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                    </div>
                                    <div className="mt-3 border-t border-gray-300 pt-3 dark:border-gray-600">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                Total Reliefs (Annual)
                                            </span>
                                            <span className="font-bold text-success-600 dark:text-success-400">
                                                {formatCurrency(
                                                    taxBreakdown.total_reliefs,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    {taxBreakdown &&
                        taxBreakdown.effective_rate !== undefined && (
                            <div className="mt-6">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                                    <Receipt className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    Tax Summary
                                </h3>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Taxable Income (Annual)
                                            </p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    taxBreakdown.taxable_income ||
                                                        0,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Annual Tax
                                            </p>
                                            <p className="mt-1 text-lg font-semibold text-error-600 dark:text-error-400">
                                                {formatCurrency(
                                                    taxBreakdown.annual_tax ||
                                                        0,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Effective Rate
                                            </p>
                                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatPercentage(
                                                    taxBreakdown.effective_rate,
                                                    2,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {taxBreakdown.is_exempt && (
                                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-success-100 p-2 dark:bg-success-900/20">
                                            <CheckCircle className="h-4 w-4 text-success-600 dark:text-success-400" />
                                            <span className="text-sm font-medium text-success-700 dark:text-success-300">
                                                {taxBreakdown.exemption_reason ||
                                                    'Tax Exempt'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    {parseFloat(payslip.pension_employer) > 0 && (
                        <div className="mt-6">
                            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                                Employer Contributions
                            </h3>
                            <div className="rounded-lg border border-gray-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Pension (Employer Contribution)
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(
                                            payslip.pension_employer,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                        <div className="flex items-center justify-between rounded-lg bg-success-50 p-6 dark:bg-success-900/20">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-success-100 p-3 dark:bg-success-800">
                                    <DollarSign className="h-6 w-6 text-success-600 dark:text-success-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Net Pay
                                    </p>
                                    <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                                        {formatCurrency(payslip.net_pay)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Amount to be paid
                                </p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    on{' '}
                                    {formatDateLong(
                                        payslip.payroll_period.payment_date,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Info className="mt-0.5 h-3 w-3 shrink-0" />
                            <div>
                                <p>
                                    This is a computer-generated payslip. For
                                    any queries regarding your payslip, please
                                    contact your manager or the HR department.
                                </p>
                                {taxBreakdown?.tax_law_version && (
                                    <p className="mt-1">
                                        Tax calculated under:{' '}
                                        {taxBreakdown.tax_law_version ===
                                        'nta_2025'
                                            ? 'Nigeria Tax Act 2025'
                                            : 'Personal Income Tax Act 2011'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </>
    );
}

Payslip.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
