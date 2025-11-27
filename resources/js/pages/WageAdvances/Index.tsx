import WageAdvanceController from '@/actions/App/Http/Controllers/WageAdvanceController.ts';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    DollarSign,
    Plus,
    TrendingUp,
    CheckCircle,
    Clock,
    Wallet,
    AlertCircle,
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

interface WageAdvance {
    id: number;
    user_id: number;
    shop_id: number;
    amount_requested: string;
    amount_approved: string | null;
    repayment_installments: number;
    amount_repaid: string;
    status: string;
    reason: string | null;
    requested_at: string;
    approved_at: string | null;
    disbursed_at: string | null;
    repayment_start_date: string | null;
    shop: Shop;
    user: User;
    approved_by: User | null;
    disbursed_by: User | null;
}

interface Statistics {
    total_advances: number;
    pending_advances: number;
    approved_advances: number;
    disbursed_advances: number;
    total_amount_requested: number;
    total_amount_approved: number;
    total_amount_disbursed: number;
    total_amount_repaid: number;
}

interface Eligibility {
    is_eligible: boolean;
    max_amount: number;
    reason: string | null;
    current_balance: number;
}

interface StatusOption {
    value: string;
    label: string;
}

interface Props {
    wageAdvances: WageAdvance[];
    statistics: Statistics;
    eligibility: Eligibility | null;
    filters: {
        status?: string;
        start_date: string;
        end_date: string;
    };
    statusOptions: StatusOption[];
}

const WageAdvancesIndex = ({
    wageAdvances,
    statistics,
    eligibility,
    filters,
    statusOptions,
}: Props) => {
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        if (selectedStatus) params.status = selectedStatus;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        router.get(WageAdvanceController.index.url(), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSelectedStatus('');
        router.get(WageAdvanceController.index.url(), {}, { preserveState: true, preserveScroll: true });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: 'light' | 'warning' | 'success' | 'error' | 'info', label: string }> = {
            pending: { color: 'warning', label: 'Pending' },
            approved: { color: 'success', label: 'Approved' },
            rejected: { color: 'error', label: 'Rejected' },
            disbursed: { color: 'info', label: 'Disbursed' },
            repaying: { color: 'primary' as 'info', label: 'Repaying' },
            completed: { color: 'success', label: 'Completed' },
            cancelled: { color: 'light', label: 'Cancelled' },
        };

        const config = statusConfig[status] || { color: 'light' as const, label: status };
        return <Badge color={config.color}>{config.label}</Badge>;
    };

    const formatDate = (datetime: string | null) => {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: string | number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(Number(amount));
    };

    return (
        <div className="h-screen">
            <Head title="Wage Advances" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Wage Advances
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Request and track salary advances
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={WageAdvanceController.approvalQueue.url()}>
                            <Button variant="outline">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approval Queue
                            </Button>
                        </Link>
                        <Link href={WageAdvanceController.create.url()}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Request Advance
                            </Button>
                        </Link>
                    </div>
                </div>

                {eligibility && (
                    <Card className={`p-4 ${eligibility.is_eligible ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {eligibility.is_eligible ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                )}
                                <div>
                                    <p className={`font-medium ${eligibility.is_eligible ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                                        {eligibility.is_eligible ? 'You are eligible for a wage advance' : 'Limited eligibility'}
                                    </p>
                                    {eligibility.reason && (
                                        <p className={`text-sm ${eligibility.is_eligible ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                            {eligibility.reason}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Max Available</p>
                                <p className={`text-lg font-bold ${eligibility.is_eligible ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                    {formatAmount(eligibility.max_amount)}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Requested
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {formatAmount(statistics.total_amount_requested)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/20">
                                <DollarSign className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Disbursed
                                </p>
                                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatAmount(statistics.total_amount_disbursed)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Repaid
                                </p>
                                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                                    {formatAmount(statistics.total_amount_repaid)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Advance Status
                            </p>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Pending
                                    </span>
                                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                        {statistics.pending_advances}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Approved
                                    </span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                        {statistics.approved_advances}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Disbursed
                                    </span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                        {statistics.disbursed_advances}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Status</option>
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Amount
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Installments
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Repaid
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {wageAdvances.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Clock className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                                No wage advances found
                                            </p>
                                            <Link href={WageAdvanceController.create.url()}>
                                                <Button className="mt-4">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Request First Advance
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    wageAdvances.map((advance) => (
                                        <tr
                                            key={advance.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatDate(advance.requested_at)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {formatAmount(advance.amount_approved || advance.amount_requested)}
                                                    </p>
                                                    {advance.amount_approved && advance.amount_approved !== advance.amount_requested && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Requested: {formatAmount(advance.amount_requested)}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {advance.repayment_installments} months
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-green-600 dark:text-green-400">
                                                    {formatAmount(advance.amount_repaid)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(advance.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={WageAdvanceController.show.url({ wageAdvance: advance.id })}
                                                >
                                                    <Button variant="outline" size="sm">
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

WageAdvancesIndex.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default WageAdvancesIndex;
