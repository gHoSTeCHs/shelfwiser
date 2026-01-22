import FundRequestController from '@/actions/App/Http/Controllers/FundRequestController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle,
    Clock,
    DollarSign,
    User,
} from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface UserType {
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
    user: UserType;
    approved_by: UserType | null;
    disbursed_by: UserType | null;
}

interface Props {
    fundRequests: FundRequest[];
    filters: {
        shop_id?: number;
    };
    shops: Shop[];
}

const FundRequestsApprove = ({ fundRequests, filters, shops }: Props) => {
    const [selectedShop, setSelectedShop] = useState(
        filters.shop_id?.toString() || '',
    );

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        if (selectedShop) params.shop_id = selectedShop;

        router.get(FundRequestController.approvalQueue.url(), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSelectedShop('');
        router.get(
            FundRequestController.approvalQueue.url(),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="h-screen">
            <Head title="Approval Queue - Fund Requests" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={FundRequestController.index.url()}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Fund Requests
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Approval Queue
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Review and approve pending fund requests
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge color="warning" size="md">
                            <Clock className="mr-1 h-3 w-3" />
                            {fundRequests.length} Pending
                        </Badge>
                    </div>
                </div>

                <Card className="p-6">
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
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
                        <Button onClick={handleFilterChange}>Apply</Button>
                        <Button onClick={handleClearFilters} variant="outline">
                            Clear
                        </Button>
                    </div>
                </Card>

                {fundRequests.length === 0 ? (
                    <Card className="p-12 text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                            All caught up!
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            There are no pending fund requests awaiting
                            approval.
                        </p>
                        <Link href={FundRequestController.index.url()}>
                            <Button className="mt-4" variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to All Requests
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {fundRequests.map((request) => (
                            <Card key={request.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="mb-3 flex items-center gap-3">
                                            <Badge color="warning">
                                                {request.request_type.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </Badge>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDateShort(
                                                    request.requested_at,
                                                )}
                                            </span>
                                        </div>

                                        <div className="mb-4 grid gap-4 sm:grid-cols-3">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {request.user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Requester
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {request.shop.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Shop
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(
                                                            request.amount,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Amount Requested
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                            <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Description
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {request.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="ml-6 flex flex-col gap-2">
                                        <Link
                                            href={FundRequestController.show.url(
                                                { fundRequest: request.id },
                                            )}
                                        >
                                            <Button className="w-full">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Review
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

FundRequestsApprove.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default FundRequestsApprove;
