import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { OrderReturn } from '@/types/return';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Filter, Package, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface Props {
    returns: {
        data: OrderReturn[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        status?: string;
    };
}

export default function Index({ returns, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'completed':
                return 'info';
            default:
                return 'light';
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number | null): string => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const handleFilterChange = (status: string) => {
        setStatusFilter(status);
        router.get(
            '/returns',
            { status: status || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout>
            <Head title="Returns" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Returns
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage customer return requests and refunds
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Filter by Status:
                            </span>
                        </div>
                        <Select
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'approved', label: 'Approved' },
                                { value: 'rejected', label: 'Rejected' },
                                { value: 'completed', label: 'Completed' },
                            ]}
                            value={statusFilter}
                            onChange={handleFilterChange}
                            className="w-48"
                        />
                    </div>
                </Card>

                {/* Returns List */}
                {returns.data.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No returns found"
                        description={
                            statusFilter
                                ? 'No returns match your filter criteria.'
                                : 'There are no return requests at this time.'
                        }
                        action={
                            statusFilter ? (
                                <Button
                                    variant="outline"
                                    onClick={() => handleFilterChange('')}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Return #
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Order #
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Reason
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Refund Amount
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Created
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                    {returns.data.map((returnItem) => (
                                        <tr key={returnItem.id}>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                                {returnItem.return_number}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                                {returnItem.order
                                                    ?.order_number || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    color={getStatusColor(
                                                        returnItem.status,
                                                    )}
                                                    size="sm"
                                                >
                                                    {returnItem.status}
                                                </Badge>
                                            </td>
                                            <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {returnItem.reason}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    returnItem.refund_amount,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                {formatDate(
                                                    returnItem.created_at,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                                <Link
                                                    href={`/returns/${returnItem.id}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Eye className="mr-1 h-4 w-4" />
                                                        View
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {returns.last_page > 1 && (
                            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing{' '}
                                        <span className="font-medium">
                                            {(returns.current_page - 1) *
                                                returns.per_page +
                                                1}
                                        </span>{' '}
                                        to{' '}
                                        <span className="font-medium">
                                            {Math.min(
                                                returns.current_page *
                                                    returns.per_page,
                                                returns.total,
                                            )}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-medium">
                                            {returns.total}
                                        </span>{' '}
                                        results
                                    </div>
                                    <div className="flex gap-2">
                                        {returns.current_page > 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get(
                                                        `/returns?page=${returns.current_page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`,
                                                    )
                                                }
                                            >
                                                Previous
                                            </Button>
                                        )}
                                        {returns.current_page <
                                            returns.last_page && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get(
                                                        `/returns?page=${returns.current_page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`,
                                                    )
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
                )}
            </div>
        </AppLayout>
    );
}

Index.layout = (page: React.ReactNode) => page;
