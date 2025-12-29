import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';
import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import PayrollReportController from '@/actions/App/Http/Controllers/PayrollReportController';
import {
    ArrowLeft,
    Download,
    FileSpreadsheet,
    FileText,
    Receipt,
    Users,
    DollarSign,
    Percent,
} from 'lucide-react';
import type { PayrollPeriod } from '@/types/payroll';

interface TaxReportData {
    summary: {
        total_employees: number;
        total_taxable_income: number;
        total_tax: number;
        average_effective_rate: number;
    };
    employees: {
        user_id: number;
        employee_name: string;
        employee_email: string;
        tax_id_number: string | null;
        gross_income: number;
        taxable_income: number;
        consolidated_relief: number;
        paye_tax: number;
        effective_rate: number;
    }[];
    period: PayrollPeriod | null;
}

interface Props {
    reportData: TaxReportData | null;
    periods: PayrollPeriod[];
    filters: {
        period_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function Tax({ reportData, periods, filters }: Props) {
    const [periodId, setPeriodId] = useState(filters.period_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    const handleFilter = () => {
        const params: Record<string, string> = {};
        if (periodId) params.period_id = periodId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get(PayrollReportController.taxRemittance.url(), params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        const params: Record<string, string> = { format };
        if (periodId) params.period_id = periodId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        const url = new URL(PayrollReportController.exportTaxRemittance.url(), window.location.origin);
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
        window.location.href = url.toString();
    };

    return (
        <>
            <Head title="Tax Remittance Report" />

            <div className="mb-6">
                <Link href={PayrollController.index.url()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        startIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back to Payroll
                    </Button>
                </Link>
            </div>

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tax Remittance Report
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        PAYE tax deductions for remittance to FIRS
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        startIcon={<FileSpreadsheet className="h-4 w-4" />}
                        onClick={() => handleExport('csv')}
                    >
                        CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        startIcon={<FileSpreadsheet className="h-4 w-4" />}
                        onClick={() => handleExport('excel')}
                    >
                        Excel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        startIcon={<FileText className="h-4 w-4" />}
                        onClick={() => handleExport('pdf')}
                    >
                        PDF
                    </Button>
                </div>
            </div>

            <Card className="mb-6 p-4">
                <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Payroll Period
                        </label>
                        <Select
                            options={[
                                { value: '', label: 'All Periods' },
                                ...periods.map((p) => ({
                                    value: p.id.toString(),
                                    label: p.period_name,
                                })),
                            ]}
                            defaultValue={periodId}
                            onChange={(value) => setPeriodId(value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date From
                        </label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date To
                        </label>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button variant="primary" onClick={handleFilter} fullWidth>
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {reportData && (
                <>
                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Employees
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                        {reportData.summary.total_employees}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                                    <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total Taxable Income
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_taxable_income)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-info-100 p-3 dark:bg-info-900/20">
                                    <DollarSign className="h-6 w-6 text-info-600 dark:text-info-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total PAYE Tax
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-error-600 dark:text-error-400">
                                        {formatCurrency(reportData.summary.total_tax)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-error-100 p-3 dark:bg-error-900/20">
                                    <Receipt className="h-6 w-6 text-error-600 dark:text-error-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Avg Effective Rate
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatPercent(reportData.summary.average_effective_rate)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                                    <Percent className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Employee Tax Details
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Employee
                                        </th>
                                        <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                            TIN
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Gross Income
                                        </th>
                                        <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                            Relief
                                        </th>
                                        <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell">
                                            Taxable Income
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            PAYE Tax
                                        </th>
                                        <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell">
                                            Eff. Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                    {reportData.employees.map((employee) => (
                                        <tr
                                            key={employee.user_id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {employee.employee_name}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {employee.employee_email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hidden px-4 py-3 text-sm text-gray-600 dark:text-gray-300 md:table-cell">
                                                {employee.tax_id_number || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">
                                                {formatCurrency(employee.gross_income)}
                                            </td>
                                            <td className="hidden px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300 md:table-cell">
                                                {formatCurrency(employee.consolidated_relief)}
                                            </td>
                                            <td className="hidden px-4 py-3 text-right text-sm text-gray-900 dark:text-white lg:table-cell">
                                                {formatCurrency(employee.taxable_income)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-error-600 dark:text-error-400">
                                                {formatCurrency(employee.paye_tax)}
                                            </td>
                                            <td className="hidden px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300 sm:table-cell">
                                                {formatPercent(employee.effective_rate)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white"
                                        >
                                            Total PAYE Tax Due
                                        </td>
                                        <td className="hidden px-4 py-3 text-right text-lg font-bold text-error-600 dark:text-error-400 lg:table-cell">
                                        </td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-error-600 dark:text-error-400">
                                            {formatCurrency(reportData.summary.total_tax)}
                                        </td>
                                        <td className="hidden sm:table-cell"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>

                    <Card className="mt-6 p-6">
                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                            Remittance Information
                        </h3>
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Remittance Authority
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Federal Inland Revenue Service (FIRS)
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        10th of the following month
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Payment Method
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        FIRS e-Tax payment platform
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Reference Period
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {reportData.period?.period_name || 'Multiple Periods'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {!reportData && (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Select filters and click "Apply Filters" to generate the tax report.
                    </p>
                </Card>
            )}
        </>
    );
}

Tax.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
