import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import PayrollReportController from '@/actions/App/Http/Controllers/PayrollReportController';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import type { PayrollPeriod } from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    FileSpreadsheet,
    FileText,
    UserCircle,
    Users,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface PensionReportData {
    summary: {
        total_employees: number;
        total_employee_contribution: number;
        total_employer_contribution: number;
        total_contribution: number;
    };
    employees: {
        user_id: number;
        employee_name: string;
        employee_email: string;
        pension_pin: string | null;
        pfa_name: string | null;
        basic_salary: number;
        employee_contribution: number;
        employer_contribution: number;
        total_contribution: number;
    }[];
    period: PayrollPeriod | null;
}

interface Props {
    reportData: PensionReportData | null;
    periods: PayrollPeriod[];
    filters: {
        period_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function Pension({ reportData, periods, filters }: Props) {
    const [periodId, setPeriodId] = useState(filters.period_id || '');
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
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get(PayrollReportController.pension.url(), params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        const params: Record<string, string> = { format };
        if (periodId) params.period_id = periodId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        const url = new URL(
            PayrollReportController.exportPension.url(),
            window.location.origin,
        );
        Object.entries(params).forEach(([key, value]) =>
            url.searchParams.append(key, value),
        );
        window.location.href = url.toString();
    };

    return (
        <>
            <Head title="Pension Report" />

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
                        Pension Contributions Report
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Employee and employer pension contributions for PFA
                        remittance
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
                                        Employee Contribution
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(
                                            reportData.summary
                                                .total_employee_contribution,
                                        )}
                                    </p>
                                </div>
                                <div className="bg-info-100 dark:bg-info-900/20 rounded-lg p-3">
                                    <UserCircle className="text-info-600 dark:text-info-400 h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Employer Contribution
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(
                                            reportData.summary
                                                .total_employer_contribution,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                                    <Building className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total Contribution
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-success-600 dark:text-success-400">
                                        {formatCurrency(
                                            reportData.summary
                                                .total_contribution,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                                    <Wallet className="h-6 w-6 text-success-600 dark:text-success-400" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Employee Pension Details
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
                                            RSA PIN
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400"
                                        >
                                            PFA
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase lg:table-cell dark:text-gray-400"
                                        >
                                            Basic Salary
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            Employee (8%)
                                        </th>
                                        <th
                                            scope="col"
                                            className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400"
                                        >
                                            Employer (10%)
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                        >
                                            Total
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
                                                        {
                                                            employee.employee_email
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell dark:text-gray-300">
                                                {employee.pension_pin || (
                                                    <Badge
                                                        color="warning"
                                                        size="sm"
                                                    >
                                                        Not Set
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell dark:text-gray-300">
                                                {employee.pfa_name || '-'}
                                            </td>
                                            <td className="hidden px-4 py-3 text-right text-sm text-gray-600 lg:table-cell dark:text-gray-300">
                                                {formatCurrency(
                                                    employee.basic_salary,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    employee.employee_contribution,
                                                )}
                                            </td>
                                            <td className="hidden px-4 py-3 text-right text-sm text-gray-900 md:table-cell dark:text-white">
                                                {formatCurrency(
                                                    employee.employer_contribution,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                                {formatCurrency(
                                                    employee.total_contribution,
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
                                            Totals
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                reportData.summary
                                                    .total_employee_contribution,
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-3 text-right font-bold text-gray-900 md:table-cell dark:text-white">
                                            {formatCurrency(
                                                reportData.summary
                                                    .total_employer_contribution,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-success-600 dark:text-success-400">
                                            {formatCurrency(
                                                reportData.summary
                                                    .total_contribution,
                                            )}
                                        </td>
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
                                        Regulatory Authority
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        National Pension Commission (PenCom)
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Due Date
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        7 working days after salary payment
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Contribution Rate
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Employee: 8% | Employer: 10% (Minimum)
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
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            Note: Remit contributions directly to each
                            employee's PFA. Ensure all employees have valid RSA
                            PINs registered before remittance.
                        </p>
                    </Card>
                </>
            )}

            {!reportData && (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Select filters and click "Apply Filters" to generate the
                        pension report.
                    </p>
                </Card>
            )}
        </>
    );
}

Pension.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
