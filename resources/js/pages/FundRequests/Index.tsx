import FundRequestController from '@/actions/App/Http/Controllers/FundRequestController.ts';
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
    XCircle,
    Clock,
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

interface FundRequest {
    id: number;
    user_id: number;
    shop_id: number;
    request_type: string;
    amount: string;
    description: string;
    status: string;
    requested_at: string;
    approved_by_user_id: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    disbursed_by_user_id: number | null;
    disbursed_at: string | null;
    receipt_uploaded: boolean;
    shop: Shop;
    user: User;
    approved_by: User | null;
    disbursed_by: User | null;
}

interface Statistics {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    disbursed_requests: number;
    total_amount_requested: number;
    total_amount_approved: number;
    total_amount_disbursed: number;
}

interface StatusOption {
    value: string;
    label: string;
}

interface TypeOption {
    value: string;
    label: string;
}

interface Props {
    fundRequests: FundRequest[];
    statistics: Statistics;
    filters: {
        shop_id?: number;
        status?: string;
        type?: string;
        start_date: string;
        end_date: string;
    };
    shops: Shop[];
    statusOptions: StatusOption[];
    typeOptions: TypeOption[];
}

const FundRequestsIndex = ({
    fundRequests,
    statistics,
    filters,
    shops,
    statusOptions,
    typeOptions,
}: Props) => {
    const [selectedShop, setSelectedShop] = useState(
        filters.shop_id?.toString() || '',
    );
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        if (selectedShop) params.shop_id = selectedShop;
        if (selectedStatus) params.status = selectedStatus;
        if (selectedType) params.type = selectedType;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        router.get('/fund-requests', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSelectedShop('');
        setSelectedStatus('');
        setSelectedType('');
        router.get('/fund-requests', {}, { preserveState: true, preserveScroll: true });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: 'light' | 'warning' | 'success' | 'error' | 'info', label: string }> = {
            pending: { color: 'warning', label: 'Pending' },
            approved: { color: 'success', label: 'Approved' },
            rejected: { color: 'error', label: 'Rejected' },
            disbursed: { color: 'info', label: 'Disbursed' },
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(Number(amount));
    };

    return (
        <div className="h-screen">
            <Head title="Fund Requests" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Fund Requests
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Request and manage operational funds for your shop
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={FundRequestController.approvalQueue.url()}>
                            <Button variant="outline">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approval Queue
                            </Button>
                        </Link>
                        <Link href={FundRequestController.create.url()}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Request
                            </Button>
                        </Link>
                    </div>
                </div>

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
                                    Total Approved
                                </p>
                                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                                    {formatAmount(statistics.total_amount_approved)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Request Status
                            </p>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Pending
                                    </span>
                                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                        {statistics.pending_requests}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Approved
                                    </span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                        {statistics.approved_requests}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Disbursed
                                    </span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                        {statistics.disbursed_requests}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="grid gap-4 sm:grid-cols-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Shop
                            </label>
                            <select
                                value={selectedShop}
                                onChange={(e) => setSelectedShop(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                                Type
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Types</option>
                                {typeOptions.map((option) => (
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
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Shop
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Amount
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
                                {fundRequests.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Clock className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                                No fund requests found
                                            </p>
                                            <Link href={FundRequestController.create.url()}>
                                                <Button className="mt-4">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Create First Request
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    fundRequests.map((request) => (
                                        <tr
                                            key={request.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatDate(request.requested_at)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                                                    {request.request_type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {request.shop.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {formatAmount(request.amount)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={FundRequestController.show.url({ fundRequest: request.id })}
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

FundRequestsIndex.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default FundRequestsIndex;
