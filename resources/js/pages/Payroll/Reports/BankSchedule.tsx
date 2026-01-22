import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import PayrollReportController from '@/actions/App/Http/Controllers/PayrollReportController';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency } from '@/lib/formatters';
import type { BankScheduleValidation, PayRun } from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    DollarSign,
    FileSpreadsheet,
    Landmark,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    payRuns: PayRun[];
    validation: BankScheduleValidation | null;
    selectedPayRunId: string | null;
}

export default function BankSchedule({
    payRuns,
    validation,
    selectedPayRunId,
}: Props) {
    const [payRunId, setPayRunId] = useState(selectedPayRunId || '');

    const handleFilter = () => {
        if (!payRunId) return;

        router.get(
            PayrollReportController.bankSchedule.url(),
            { pay_run_id: payRunId },
            { preserveState: true, replace: true },
        );
    };

    const handleExport = (format: 'csv' | 'excel' | 'nibss') => {
        if (!payRunId) return;

        const url = new URL(
            PayrollReportController.exportBankSchedule.url(),
            window.location.origin,
        );
        url.searchParams.append('pay_run_id', payRunId);
        url.searchParams.append('format', format);
        window.location.href = url.toString();
    };

    const completedPayRuns = payRuns.filter(
        (pr) => pr.status === 'completed' || pr.status === 'approved',
    );

    return (
        <>
            <Head title="Bank Schedule" />

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
                        Bank Schedule
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Generate bank payment schedules for salary disbursement
                    </p>
                </div>

                {validation && validation.can_generate && (
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
                            variant="primary"
                            size="sm"
                            startIcon={<Landmark className="h-4 w-4" />}
                            onClick={() => handleExport('nibss')}
                        >
                            NIBSS Format
                        </Button>
                    </div>
                )}
            </div>

            <Card className="mb-6 p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Pay Run
                        </label>
                        <Select
                            options={[
                                { value: '', label: 'Select a pay run...' },
                                ...completedPayRuns.map((pr) => ({
                                    value: pr.id.toString(),
                                    label: `${pr.reference} - ${pr.name} (${formatCurrency(parseFloat(pr.total_net))})`,
                                })),
                            ]}
                            defaultValue={payRunId}
                            onChange={(value) => setPayRunId(value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            variant="primary"
                            onClick={handleFilter}
                            disabled={!payRunId}
                            fullWidth
                        >
                            Generate Schedule
                        </Button>
                    </div>
                </div>
            </Card>

            {validation && (
                <>
                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Valid Records
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">
                                        {validation.valid_count}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                                    <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Invalid Records
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-error-600 dark:text-error-400">
                                        {validation.invalid_count}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-error-100 p-3 dark:bg-error-900/20">
                                    <XCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Valid Amount
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-success-600 dark:text-success-400">
                                        {formatCurrency(
                                            validation.total_valid_amount,
                                        )}
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
                                        Status
                                    </p>
                                    <p className="mt-1">
                                        {validation.can_generate ? (
                                            <Badge color="success" size="md">
                                                Ready to Export
                                            </Badge>
                                        ) : (
                                            <Badge color="error" size="md">
                                                Fix Errors First
                                            </Badge>
                                        )}
                                    </p>
                                </div>
                                <div
                                    className={`rounded-lg p-3 ${
                                        validation.can_generate
                                            ? 'bg-success-100 dark:bg-success-900/20'
                                            : 'bg-error-100 dark:bg-error-900/20'
                                    }`}
                                >
                                    <Landmark
                                        className={`h-6 w-6 ${
                                            validation.can_generate
                                                ? 'text-success-600 dark:text-success-400'
                                                : 'text-error-600 dark:text-error-400'
                                        }`}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {validation.invalid.length > 0 && (
                        <Card className="mb-6 overflow-hidden border-error-200 dark:border-error-800">
                            <div className="border-b border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-error-600 dark:text-error-400" />
                                    <h3 className="text-lg font-semibold text-error-800 dark:text-error-200">
                                        Invalid Records - Require Attention
                                    </h3>
                                </div>
                                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                                    These employees have missing or invalid bank
                                    details and will be excluded from the
                                    payment schedule.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-error-50 dark:bg-error-900/10">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 text-left text-xs font-medium tracking-wider text-error-600 uppercase dark:text-error-400"
                                            >
                                                Employee
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 text-right text-xs font-medium tracking-wider text-error-600 uppercase dark:text-error-400"
                                            >
                                                Amount
                                            </th>
                                            <th
                                                scope="col"
                                                className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-error-600 uppercase md:table-cell dark:text-error-400"
                                            >
                                                Issues
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-error-100 bg-white dark:divide-error-900/20 dark:bg-gray-900">
                                        {validation.invalid.map((item) => (
                                            <tr key={item.employee_id}>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {item.employee_name}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                    {formatCurrency(
                                                        item.amount,
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-3 md:table-cell">
                                                    <ul className="list-inside list-disc text-sm text-error-600 dark:text-error-400">
                                                        {item.errors.map(
                                                            (error, idx) => (
                                                                <li key={idx}>
                                                                    {error}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {validation.valid.length > 0 && (
                        <Card className="overflow-hidden">
                            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Valid Payment Records
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
                                                Bank
                                            </th>
                                            <th
                                                scope="col"
                                                className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase lg:table-cell dark:text-gray-400"
                                            >
                                                Account Number
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                            >
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                        {validation.valid.map((item) => (
                                            <tr
                                                key={item.employee_id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {item.employee_name}
                                                </td>
                                                <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell dark:text-gray-300">
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {item.bank_name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            Code:{' '}
                                                            {item.bank_code}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="font-mono hidden px-4 py-3 text-sm text-gray-600 lg:table-cell dark:text-gray-300">
                                                    {item.account_number}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                                    {formatCurrency(
                                                        item.amount,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 dark:bg-gray-800">
                                        <tr>
                                            <td
                                                colSpan={2}
                                                className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white"
                                            >
                                                Total Amount
                                            </td>
                                            <td className="hidden px-4 py-3 lg:table-cell"></td>
                                            <td className="px-4 py-3 text-right text-lg font-bold text-success-600 dark:text-success-400">
                                                {formatCurrency(
                                                    validation.total_valid_amount,
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>
                    )}

                    <Card className="mt-6 p-6">
                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                            About NIBSS Format
                        </h3>
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                                The Nigerian Inter-Bank Settlement System
                                (NIBSS) format is the standard format used by
                                Nigerian banks for bulk transfers. When you
                                export to NIBSS format:
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <li>A fixed-width text file is generated</li>
                                <li>
                                    Bank codes are automatically mapped to
                                    CBN-approved codes
                                </li>
                                <li>
                                    Account numbers are validated for correct
                                    length
                                </li>
                                <li>
                                    The file can be uploaded directly to your
                                    bank's bulk transfer portal
                                </li>
                            </ul>
                        </div>
                    </Card>
                </>
            )}

            {!validation && completedPayRuns.length === 0 && (
                <Card className="p-8 text-center">
                    <Landmark className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        No Completed Pay Runs
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Complete a pay run first to generate a bank payment
                        schedule.
                    </p>
                </Card>
            )}

            {!validation && completedPayRuns.length > 0 && (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Select a pay run and click "Generate Schedule" to
                        validate bank details and prepare the payment schedule.
                    </p>
                </Card>
            )}
        </>
    );
}

BankSchedule.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
