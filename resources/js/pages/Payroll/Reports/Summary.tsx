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
    DollarSign,
    Users,
    TrendingUp,
    Building2,
} from 'lucide-react';
import type { PayrollPeriod, PayRunSummary } from '@/types/payroll';
import type { Shop } from '@/types/shop';

interface ReportData {
    period: PayrollPeriod | null;
    summary: {
        total_employees: number;
        total_gross: number;
        total_deductions: number;
        total_net: number;
        total_employer_costs: number;
        total_pension_employee: number;
        total_pension_employer: number;
        total_tax: number;
        total_nhf: number;
        total_nhis: number;
    };
    by_shop: {
        shop_id: number;
        shop_name: string;
        employee_count: number;
        total_gross: number;
        total_net: number;
    }[];
    by_department: {
        department: string;
        employee_count: number;
        total_gross: number;
        total_net: number;
    }[];
}

interface Props {
    reportData: ReportData | null;
    periods: PayrollPeriod[];
    shops: Shop[];
    filters: {
        period_id?: string;
        shop_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function Summary({ reportData, periods, shops, filters }: Props) {
    const [periodId, setPeriodId] = useState(filters.period_id || '');
    const [shopId, setShopId] = useState(filters.shop_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const handleFilter = () => {
        const params: Record<string, string> = {};
        if (periodId) params.period_id = periodId;
        if (shopId) params.shop_id = shopId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get(PayrollReportController.summary.url(), params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        const params: Record<string, string> = { format };
        if (periodId) params.period_id = periodId;
        if (shopId) params.shop_id = shopId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        const url = new URL(PayrollReportController.exportSummary.url(), window.location.origin);
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
        window.location.href = url.toString();
    };

    return (
        <>
            <Head title="Payroll Summary Report" />

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
                        Payroll Summary Report
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Overview of payroll costs and employee compensation
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                            Shop
                        </label>
                        <Select
                            options={[
                                { value: '', label: 'All Shops' },
                                ...shops.map((s) => ({
                                    value: s.id.toString(),
                                    label: s.name,
                                })),
                            ]}
                            defaultValue={shopId}
                            onChange={(value) => setShopId(value)}
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
                                        Total Employees
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
                                        Total Gross Pay
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_gross)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                                    <DollarSign className="h-6 w-6 text-success-600 dark:text-success-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total Net Pay
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-success-600 dark:text-success-400">
                                        {formatCurrency(reportData.summary.total_net)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                                    <TrendingUp className="h-6 w-6 text-success-600 dark:text-success-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Employer Costs
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_employer_costs)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                                    <Building2 className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="mb-6 grid gap-6 lg:grid-cols-2">
                        <Card className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Deductions Breakdown
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">PAYE Tax</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_tax)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Employee Pension
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_pension_employee)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">NHF</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_nhf)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">NHIS</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_nhis)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-3 font-semibold">
                                    <span>Total Deductions</span>
                                    <span>{formatCurrency(reportData.summary.total_deductions)}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Employer Contributions
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Employer Pension
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(reportData.summary.total_pension_employer)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-3 font-semibold">
                                    <span>Total Employer Costs</span>
                                    <span>{formatCurrency(reportData.summary.total_employer_costs)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {reportData.by_shop.length > 0 && (
                        <Card className="mb-6 overflow-hidden">
                            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    By Shop
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Shop
                                            </th>
                                            <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                                Employees
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Gross Pay
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Net Pay
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                        {reportData.by_shop.map((item) => (
                                            <tr key={item.shop_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {item.shop_name}
                                                </td>
                                                <td className="hidden px-4 py-3 text-right text-gray-600 dark:text-gray-300 md:table-cell">
                                                    {item.employee_count}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                    {formatCurrency(item.total_gross)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-success-600 dark:text-success-400">
                                                    {formatCurrency(item.total_net)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {reportData.by_department.length > 0 && (
                        <Card className="overflow-hidden">
                            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    By Department
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Department
                                            </th>
                                            <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                                Employees
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Gross Pay
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Net Pay
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                        {reportData.by_department.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {item.department || 'Unassigned'}
                                                </td>
                                                <td className="hidden px-4 py-3 text-right text-gray-600 dark:text-gray-300 md:table-cell">
                                                    {item.employee_count}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                    {formatCurrency(item.total_gross)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-success-600 dark:text-success-400">
                                                    {formatCurrency(item.total_net)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {!reportData && (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Select filters and click "Apply Filters" to generate the report.
                    </p>
                </Card>
            )}
        </>
    );
}

Summary.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
