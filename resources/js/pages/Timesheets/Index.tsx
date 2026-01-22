import TimesheetController from '@/actions/App/Http/Controllers/TimesheetController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Form, Head, Link, router } from '@inertiajs/react';
import { Calendar, CheckCircle, Clock, Coffee, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
    slug: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Timesheet {
    id: number;
    user_id: number;
    shop_id: number;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    break_start: string | null;
    break_end: string | null;
    break_duration_minutes: number;
    regular_hours: string;
    overtime_hours: string;
    total_hours: string;
    status: string;
    notes: string | null;
    approved_by_user_id: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    shop: Shop;
    user: User;
    approved_by: User | null;
}

interface Summary {
    total_timesheets: number;
    approved_timesheets: number;
    pending_timesheets: number;
    rejected_timesheets: number;
    total_regular_hours: number;
    total_overtime_hours: number;
    total_hours: number;
    overtime_multiplier: number;
    period_start: string;
    period_end: string;
}

interface StatusOption {
    value: string;
    label: string;
}

interface Props {
    timesheets: Timesheet[];
    summary: Summary;
    activeTimesheet: Timesheet | null;
    filters: {
        shop_id?: number;
        status?: string;
        start_date: string;
        end_date: string;
    };
    shops: Shop[];
    statusOptions: StatusOption[];
}

const TimesheetsIndex = ({
    timesheets,
    summary,
    activeTimesheet,
    filters,
    shops,
    statusOptions,
}: Props) => {
    const [selectedShop, setSelectedShop] = useState(
        filters.shop_id?.toString() || '',
    );
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [processing, setProcessing] = useState(false);

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        if (selectedShop) params.shop_id = selectedShop;
        if (selectedStatus) params.status = selectedStatus;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        router.get('/timesheets', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSelectedShop('');
        setSelectedStatus('');
        router.get(
            '/timesheets',
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            {
                color: 'light' | 'warning' | 'success' | 'error' | 'info';
                label: string;
            }
        > = {
            draft: { color: 'light', label: 'Draft' },
            submitted: { color: 'warning', label: 'Submitted' },
            approved: { color: 'success', label: 'Approved' },
            rejected: { color: 'error', label: 'Rejected' },
            paid: { color: 'info', label: 'Paid' },
        };

        const config = statusConfig[status] || {
            color: 'light' as const,
            label: status,
        };
        return <Badge color={config.color}>{config.label}</Badge>;
    };

    const formatTime = (datetime: string | null) => {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (datetime: string | null) => {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="h-screen">
            <Head title="My Timesheets" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            My Timesheets
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Track your work hours and submit timesheets for
                            approval
                        </p>
                    </div>
                    <Link href={TimesheetController.approvalQueue.url()}>
                        <Button variant="outline">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approval Queue
                        </Button>
                    </Link>
                </div>

                {activeTimesheet && (
                    <Card className="border-l-4 border-brand-500 bg-brand-50 p-6 dark:bg-brand-900/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Currently Clocked In
                                    </h3>
                                </div>
                                <div className="mt-2 space-y-1 text-sm">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Shop:{' '}
                                        <span className="font-medium">
                                            {activeTimesheet.shop.name}
                                        </span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Clock In:{' '}
                                        <span className="font-medium">
                                            {formatTime(
                                                activeTimesheet.clock_in,
                                            )}
                                        </span>
                                    </p>
                                    {activeTimesheet.break_start &&
                                        !activeTimesheet.break_end && (
                                            <p className="text-orange-700 dark:text-orange-400">
                                                <Coffee className="mr-1 inline h-4 w-4" />
                                                On Break since{' '}
                                                {formatTime(
                                                    activeTimesheet.break_start,
                                                )}
                                            </p>
                                        )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {activeTimesheet.break_start &&
                                !activeTimesheet.break_end ? (
                                    <Form
                                        action={TimesheetController.endBreak.url(
                                            { timesheet: activeTimesheet.id },
                                        )}
                                        method="post"
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                disabled={processing}
                                            >
                                                End Break
                                            </Button>
                                        )}
                                    </Form>
                                ) : (
                                    <Form
                                        action={TimesheetController.startBreak.url(
                                            { timesheet: activeTimesheet.id },
                                        )}
                                        method="post"
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                disabled={processing}
                                            >
                                                <Coffee className="mr-2 h-4 w-4" />
                                                Start Break
                                            </Button>
                                        )}
                                    </Form>
                                )}
                                <Form
                                    action={TimesheetController.clockOut.url({
                                        timesheet: activeTimesheet.id,
                                    })}
                                    method="post"
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Clock Out
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        </div>
                    </Card>
                )}

                {!activeTimesheet && shops.length > 0 && (
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Not Clocked In
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Start tracking your work hours
                                </p>
                            </div>
                            <Form
                                action={TimesheetController.clockIn.url()}
                                method="post"
                            >
                                {({ processing }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="shop_id"
                                            value={shops[0].id}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Clock In
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </div>
                    </Card>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Hours
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {summary.total_hours.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/20">
                                <Clock className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Regular Hours
                                </p>
                                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {summary.total_regular_hours.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Overtime Hours
                                </p>
                                <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                                    {summary.total_overtime_hours.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Timesheet Status
                            </p>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Approved
                                    </span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                        {summary.approved_timesheets}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Pending
                                    </span>
                                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                        {summary.pending_timesheets}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Rejected
                                    </span>
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                        {summary.rejected_timesheets}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Shop
                            </label>
                            <select
                                value={selectedShop}
                                onChange={(e) =>
                                    setSelectedShop(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Shops</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) =>
                                    setSelectedStatus(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Status</option>
                                {statusOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleFilterChange} className="flex-1">
                            Apply Filters
                        </Button>
                        <Button onClick={handleClearFilters} variant="outline">
                            Clear
                        </Button>
                    </div>
                </Card>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Shop
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Clock In / Out
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Hours
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {timesheets.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Clock className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                                No timesheets found for the
                                                selected period
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    timesheets.map((timesheet) => (
                                        <tr
                                            key={timesheet.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatDate(timesheet.date)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {timesheet.shop.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="text-gray-900 dark:text-white">
                                                        {formatTime(
                                                            timesheet.clock_in,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatTime(
                                                            timesheet.clock_out,
                                                        )}
                                                    </p>
                                                    {timesheet.break_duration_minutes >
                                                        0 && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Break:{' '}
                                                            {
                                                                timesheet.break_duration_minutes
                                                            }
                                                            min
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {timesheet.total_hours}h
                                                    </p>
                                                    {parseFloat(
                                                        timesheet.overtime_hours,
                                                    ) > 0 && (
                                                        <p className="text-xs text-orange-600 dark:text-orange-400">
                                                            OT:{' '}
                                                            {
                                                                timesheet.overtime_hours
                                                            }
                                                            h
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(
                                                    timesheet.status,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={TimesheetController.show.url(
                                                        {
                                                            timesheet:
                                                                timesheet.id,
                                                        },
                                                    )}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        View
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

TimesheetsIndex.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default TimesheetsIndex;
