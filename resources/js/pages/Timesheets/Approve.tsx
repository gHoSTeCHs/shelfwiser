import TimesheetController from '@/actions/App/Http/Controllers/TimesheetController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { formatDateShort, formatTime } from '@/lib/formatters';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    MapPin,
    User,
} from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
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
    break_duration_minutes: number;
    regular_hours: string;
    overtime_hours: string;
    total_hours: string;
    status: string;
    notes: string | null;
    shop: Shop;
    user: User;
}

interface Props {
    timesheets: Timesheet[];
    filters: {
        shop_id?: number;
    };
    shops: Shop[];
}

const TimesheetsApprove = ({ timesheets, filters, shops }: Props) => {
    const [selectedShop, setSelectedShop] = useState(
        filters.shop_id?.toString() || '',
    );

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        if (selectedShop) params.shop_id = selectedShop;

        router.get('/timesheets/approval-queue', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSelectedShop('');
        router.get(
            '/timesheets/approval-queue',
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="h-screen">
            <Head title="Timesheet Approval Queue" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={TimesheetController.index.url()}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                My Timesheets
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Timesheet Approval Queue
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Review and approve timesheets from your team
                            </p>
                        </div>
                    </div>
                </div>

                {timesheets.length > 0 && (
                    <Card className="border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <p className="font-medium text-yellow-900 dark:text-yellow-100">
                                {timesheets.length} timesheet
                                {timesheets.length !== 1 ? 's' : ''} awaiting
                                your approval
                            </p>
                        </div>
                    </Card>
                )}

                <Card className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Filter by Shop
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

                        <div className="flex items-end gap-2">
                            <Button
                                onClick={handleFilterChange}
                                className="flex-1"
                            >
                                Apply Filter
                            </Button>
                            <Button
                                onClick={handleClearFilters}
                                variant="outline"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </Card>

                {timesheets.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                                All caught up!
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                There are no timesheets waiting for your
                                approval at the moment.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {timesheets.map((timesheet) => (
                            <Card key={timesheet.id} className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {timesheet.user.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {timesheet.user.email}
                                            </p>
                                        </div>
                                        <Badge color="warning">Pending</Badge>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="flex items-start gap-2">
                                            <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Date
                                                </p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatDateShort(timesheet.date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Shop
                                                </p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {timesheet.shop.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Clock In
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                                    {formatTime(
                                                        timesheet.clock_in,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Clock Out
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                                    {formatTime(
                                                        timesheet.clock_out,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Break
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                                    {
                                                        timesheet.break_duration_minutes
                                                    }
                                                    min
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Regular
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {timesheet.regular_hours}h
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Overtime
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-orange-600 dark:text-orange-400">
                                                {timesheet.overtime_hours}h
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Total
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-brand-600 dark:text-brand-400">
                                                {timesheet.total_hours}h
                                            </p>
                                        </div>
                                    </div>

                                    {timesheet.notes && (
                                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                            <p className="mb-1 text-xs font-medium text-blue-900 dark:text-blue-100">
                                                Notes:
                                            </p>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                {timesheet.notes}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <Link
                                            href={TimesheetController.show.url({
                                                timesheet: timesheet.id,
                                            })}
                                            className="flex-1"
                                        >
                                            <Button
                                                variant="outline"
                                                fullWidth
                                                size="sm"
                                            >
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

TimesheetsApprove.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default TimesheetsApprove;
