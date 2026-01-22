import PayRunController from '@/actions/App/Http/Controllers/PayRunController';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency } from '@/lib/formatters';
import { getPayRunStatusColor, getPayRunStatusLabel } from '@/lib/status-configs';
import type { PaginatedResponse } from '@/types/index.d';
import type { PayCalendar, PayRun } from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle,
    Clock,
    Plus,
    Search,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    payRuns: PaginatedResponse<PayRun>;
    summary: {
        total: number;
        pending_approval: number;
        completed_this_month: number;
    };
    payCalendars: PayCalendar[];
    filters: {
        status?: string;
        pay_calendar_id?: string;
        search?: string;
    };
}

export default function Index({
    payRuns,
    summary,
    payCalendars,
    filters,
}: Props) {
    const [status, setStatus] = useState(filters.status || '');
    const [calendarId, setCalendarId] = useState(filters.pay_calendar_id || '');
    const [search, setSearch] = useState(filters.search || '');

    const handleFilterChange = (
        newStatus?: string,
        newCalendarId?: string,
        newSearch?: string,
    ) => {
        const params: Record<string, string> = {};
        const s = newStatus ?? status;
        const c = newCalendarId ?? calendarId;
        const q = newSearch ?? search;

        if (s) params.status = s;
        if (c) params.pay_calendar_id = c;
        if (q) params.search = q;

        router.get(PayRunController.index.url(), params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        handleFilterChange(value, undefined, undefined);
    };

    const handleCalendarChange = (value: string) => {
        setCalendarId(value);
        handleFilterChange(undefined, value, undefined);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange(undefined, undefined, search);
    };

    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_review', label: 'Pending Review' },
        { value: 'pending_approval', label: 'Pending Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <>
            <Head title="Pay Runs" />

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pay Runs
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage payroll processing and employee payments
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        startIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                            router.visit(PayRunController.create.url())
                        }
                    >
                        Create Pay Run
                    </Button>
                </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Pay Runs
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {summary.total}
                            </p>
                        </div>
                        <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                            <Calendar className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Pending Approval
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {summary.pending_approval}
                            </p>
                        </div>
                        <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                            <Clock className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Completed This Month
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {summary.completed_this_month}
                            </p>
                        </div>
                        <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                            <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <form onSubmit={handleSearchSubmit}>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Search
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Reference or name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Status
                            </label>
                            <Select
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    ...statusOptions,
                                ]}
                                defaultValue={status}
                                onChange={handleStatusChange}
                            />
                        </div>

                        {payCalendars.length > 0 && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Pay Calendar
                                </label>
                                <Select
                                    options={[
                                        { value: '', label: 'All Calendars' },
                                        ...payCalendars.map((cal) => ({
                                            value: cal.id.toString(),
                                            label: cal.name,
                                        })),
                                    ]}
                                    defaultValue={calendarId}
                                    onChange={handleCalendarChange}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {payRuns.data.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                icon={<Calendar />}
                                title="No pay runs found"
                                description="Get started by creating your first pay run."
                                action={
                                    <Button
                                        variant="primary"
                                        onClick={() =>
                                            router.visit(
                                                PayRunController.create.url(),
                                            )
                                        }
                                    >
                                        Create Pay Run
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Reference
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Period
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400">
                                        Employees
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase lg:table-cell dark:text-gray-400">
                                        Gross
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Net
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Status
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {payRuns.data.map((payRun) => (
                                    <tr
                                        key={payRun.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {payRun.reference}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {payRun.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col text-sm">
                                                <span className="text-gray-900 dark:text-white">
                                                    {payRun.payroll_period
                                                        ?.period_name || '-'}
                                                </span>
                                                {payRun.pay_calendar && (
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {
                                                            payRun.pay_calendar
                                                                .name
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                                <Users className="h-4 w-4" />
                                                <span>
                                                    {payRun.employee_count}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-right text-sm font-medium text-gray-900 lg:table-cell dark:text-white">
                                            {formatCurrency(payRun.total_gross)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                            {formatCurrency(payRun.total_net)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                color={getPayRunStatusColor(
                                                    payRun.status,
                                                )}
                                                size="sm"
                                            >
                                                {getPayRunStatusLabel(payRun.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={PayRunController.show.url(
                                                    { payRun: payRun.id },
                                                )}
                                                className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
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

                {payRuns.last_page > 1 && (
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {payRuns.from} to {payRuns.to} of{' '}
                                {payRuns.total} results
                            </p>
                            <div className="flex gap-2">
                                {payRuns.prev_page_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.visit(payRuns.prev_page_url!)
                                        }
                                    >
                                        Previous
                                    </Button>
                                )}
                                {payRuns.next_page_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.visit(payRuns.next_page_url!)
                                        }
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
