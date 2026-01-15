import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import PayrollReportController from '@/actions/App/Http/Controllers/PayrollReportController';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import type {
    PayrollPeriod,
    TaxLawVersion,
    TaxLawVersionOption,
} from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    DollarSign,
    FileSpreadsheet,
    FileText,
    Info,
    Percent,
    Receipt,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface TaxReportData {
    summary: {
        total_employees: number;
        total_taxable_income: number;
        total_tax: number;
        average_effective_rate: number;
        low_income_exempt_count?: number;
        total_reliefs?: number;
    };
    employees: {
        user_id: number;
        employee_name: string;
        employee_email: string;
        tax_id_number: string | null;
        gross_income: number;
        taxable_income: number;
        consolidated_relief: number;
        total_reliefs?: number;
        rent_relief?: number;
        paye_tax: number;
        effective_rate: number;
        is_low_income_exempt?: boolean;
        tax_law_version?: TaxLawVersion;
    }[];
    period: PayrollPeriod | null;
    tax_law_version?: TaxLawVersion;
    tax_law_label?: string;
}

interface Props {
    reportData: TaxReportData | null;
    periods: PayrollPeriod[];
    taxLawVersions?: TaxLawVersionOption[];
    filters: {
        period_id?: string;
        date_from?: string;
        date_to?: string;
        tax_law_version?: TaxLawVersion;
    };
}

export default function Tax({
    reportData,
    periods,
    taxLawVersions,
    filters,
}: Props) {
    const [periodId, setPeriodId] = useState(filters.period_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [taxLawVersion, setTaxLawVersion] = useState<string>(
        filters.tax_law_version || '',
    );

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
        if (taxLawVersion) params.tax_law_version = taxLawVersion;

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
        if (taxLawVersion) params.tax_law_version = taxLawVersion;

        const url = new URL(
            PayrollReportController.exportTaxRemittance.url(),
            window.location.origin,
        );
        Object.entries(params).forEach(([key, value]) =>
            url.searchParams.append(key, value),
        );
        window.location.href = url.toString();
    };

    const isNTA2025 = reportData?.tax_law_version === 'nta_2025';
    const hasLowIncomeExempt =
        (reportData?.summary.low_income_exempt_count ?? 0) > 0;

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
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Tax Remittance Report
                        </h1>
                        {reportData?.tax_law_label && (
                            <Badge
                                color={isNTA2025 ? 'info' : 'light'}
                                size="md"
                            >
                                <Receipt className="mr-1 h-3 w-3" />
                                {reportData.tax_law_label}
                            </Badge>
                        )}
                    </div>
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
                <div className="grid gap-4 sm:grid-cols-5">
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

                    {taxLawVersions && taxLawVersions.length > 0 && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tax Law Version
                            </label>
                            <Select
                                options={[
                                    { value: '', label: 'Auto-detect' },
                                    ...taxLawVersions.map((v) => ({
                                        value: v.value,
                                        label: v.label,
                                    })),
                                ]}
                                defaultValue={taxLawVersion}
                                onChange={(value) => setTaxLawVersion(value)}
                            />
                        </div>
                    )}

                    <div className="flex items-end">
                        <Button
                            variant="primary"
                            onClick={handleFilter}
                            fullWidth
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {reportData && (
                <>
                    {hasLowIncomeExempt && (
                        <Card className="mb-6 border-success-200 bg-success-50/50 p-4 dark:border-success-800 dark:bg-success-900/10">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
                                <div>
                                    <p className="font-semibold text-success-800 dark:text-success-200">
                                        {
                                            reportData.summary
                                                .low_income_exempt_count
                                        }{' '}
                                        Employee
                                        {(reportData.summary
                                            .low_income_exempt_count ?? 0) !== 1
                                            ? 's'
                                            : ''}{' '}
                                        Tax-Exempt
                                    </p>
                                    <p className="text-sm text-success-600 dark:text-success-400">
                                        Qualifying for low-income exemption
                                        under NTA 2025 (annual income ≤
                                        ₦800,000)
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

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
                                    {hasLowIncomeExempt && (
                                        <p className="mt-1 text-xs text-success-600 dark:text-success-400">
                                            {
                                                reportData.summary
                                                    .low_income_exempt_count
                                            }{' '}
                                            exempt
                                        </p>
                                    )}
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
                                        {formatCurrency(
                                            reportData.summary
                                                .total_taxable_income,
                                        )}
                                    </p>
                                </div>
                                <div className="bg-info-100 dark:bg-info-900/20 rounded-lg p-3">
                                    <DollarSign className="text-info-600 dark:text-info-400 h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total PAYE Tax
                                        </p>
                                        {reportData.tax_law_label && (
                                            <Badge
                                                color={
                                                    isNTA2025 ? 'info' : 'light'
                                                }
                                                size="sm"
                                            >
                                                {reportData.tax_law_label}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xl font-bold text-error-600 dark:text-error-400">
                                        {formatCurrency(
                                            reportData.summary.total_tax,
                                        )}
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
                                        {formatPercent(
                                            reportData.summary
                                                .average_effective_rate,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                                    <Percent className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {reportData.summary.total_reliefs &&
                        reportData.summary.total_reliefs > 0 && (
                            <Card className="mb-6 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-success-100 p-2 dark:bg-success-900/20">
                                            <Info className="h-5 w-5 text-success-600 dark:text-success-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                Total Tax Reliefs Applied
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {isNTA2025
                                                    ? 'Including pension and rent reliefs'
                                                    : 'CRA and pension reliefs'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xl font-bold text-success-600 dark:text-success-400">
                                        {formatCurrency(
                                            reportData.summary.total_reliefs,
                                        )}
                                    </p>
                                </div>
                            </Card>
                        )}

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
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            Employee
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400"
                                        >
                                            TIN
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            Gross Income
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400"
                                        >
                                            Total Reliefs
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase lg:table-cell dark:text-gray-400"
                                        >
                                            Taxable Income
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            PAYE Tax
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase sm:table-cell dark:text-gray-400"
                                        >
                                            Eff. Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                    {reportData.employees.map((employee) => (
                                        <tr
                                            key={employee.user_id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                                employee.is_low_income_exempt
                                                    ? 'bg-success-50/50 dark:bg-success-900/10'
                                                    : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {
                                                                employee.employee_name
                                                            }
                                                        </span>
                                                        {employee.is_low_income_exempt && (
                                                            <Badge
                                                                color="success"
                                                                size="sm"
                                                            >
                                                                Exempt
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {
                                                            employee.employee_email
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell dark:text-gray-300">
                                                {employee.tax_id_number || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">
                                                {formatCurrency(
                                                    employee.gross_income,
                                                )}
                                            </td>
                                            <td className="hidden px-4 py-3 text-right md:table-cell">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm text-success-600 dark:text-success-400">
                                                        {formatCurrency(
                                                            employee.total_reliefs ??
                                                                employee.consolidated_relief,
                                                        )}
                                                    </span>
                                                    {employee.rent_relief &&
                                                        employee.rent_relief >
                                                            0 && (
                                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                (incl. rent:{' '}
                                                                {formatCurrency(
                                                                    employee.rent_relief,
                                                                )}
                                                                )
                                                            </span>
                                                        )}
                                                </div>
                                            </td>
                                            <td className="hidden px-4 py-3 text-right text-sm text-gray-900 lg:table-cell dark:text-white">
                                                {formatCurrency(
                                                    employee.taxable_income,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {employee.is_low_income_exempt ? (
                                                    <span className="text-sm font-medium text-success-600 dark:text-success-400">
                                                        ₦0
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-semibold text-error-600 dark:text-error-400">
                                                        {formatCurrency(
                                                            employee.paye_tax,
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="hidden px-4 py-3 text-right text-sm text-gray-600 sm:table-cell dark:text-gray-300">
                                                {formatPercent(
                                                    employee.effective_rate,
                                                )}
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
                                        <td className="hidden px-4 py-3 text-right text-lg font-bold text-error-600 lg:table-cell dark:text-error-400"></td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-error-600 dark:text-error-400">
                                            {formatCurrency(
                                                reportData.summary.total_tax,
                                            )}
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
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Due Date
                                    </p>
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
                                        {reportData.period?.period_name ||
                                            'Multiple Periods'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Tax Law Applied
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {reportData.tax_law_version ===
                                            'nta_2025'
                                                ? 'Nigeria Tax Act 2025'
                                                : 'Personal Income Tax Act 2011'}
                                        </p>
                                        <Badge
                                            color={isNTA2025 ? 'info' : 'light'}
                                            size="sm"
                                        >
                                            {reportData.tax_law_label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {isNTA2025 && (
                        <Card className="border-info-200 bg-info-50 dark:border-info-800 dark:bg-info-900/20 mt-6 p-4">
                            <div className="flex items-start gap-3">
                                <Info className="text-info-600 dark:text-info-400 mt-0.5 h-5 w-5" />
                                <div>
                                    <h4 className="text-info-800 dark:text-info-200 font-semibold">
                                        NTA 2025 Key Changes Applied
                                    </h4>
                                    <ul className="text-info-700 dark:text-info-300 mt-2 space-y-1 text-sm">
                                        <li>
                                            • Low-income exemption for employees
                                            earning ≤ ₦800,000 annually
                                        </li>
                                        <li>
                                            • CRA (Consolidated Relief
                                            Allowance) is abolished
                                        </li>
                                        <li>
                                            • Rent relief available for
                                            non-homeowners (up to ₦500,000)
                                        </li>
                                        <li>
                                            • New progressive tax bands with top
                                            rate of 25%
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {!reportData && (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Select filters and click "Apply Filters" to generate the
                        tax report.
                    </p>
                </Card>
            )}
        </>
    );
}

Tax.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
