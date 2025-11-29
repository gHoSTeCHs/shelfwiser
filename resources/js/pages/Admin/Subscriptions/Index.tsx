import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { CreditCard, TrendingUp, Users, DollarSign, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import { useState } from 'react';

interface Subscription {
    id: number;
    name: string;
    subscription_plan: string;
    subscription_ends_at: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    subscriptions: {
        data: Subscription[];
        total: number;
    };
    stats: {
        total_subscriptions: number;
        active_subscriptions: number;
        expired_subscriptions: number;
        total_revenue: number;
    };
    filters: {
        search?: string;
        plan?: string;
        status?: string;
    };
    plans: string[];
}

export default function Index({ subscriptions, stats, filters, plans }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const formatDate = (date: string | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan.toLowerCase()) {
            case 'enterprise':
                return 'primary';
            case 'professional':
                return 'success';
            case 'starter':
                return 'info';
            default:
                return 'light';
        }
    };

    return (
        <AppLayout>
            <Head title="Subscription Management" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Subscription Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage tenant subscriptions and billing
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total Subscriptions
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_subscriptions}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Active
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.active_subscriptions}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Expired
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.expired_subscriptions}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                                <CreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total Revenue
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    ${stats.total_revenue.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search tenants..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select
                            options={[
                                { value: '', label: 'All Plans' },
                                ...plans.map((plan) => ({
                                    value: plan,
                                    label: plan.charAt(0).toUpperCase() + plan.slice(1),
                                })),
                            ]}
                            defaultValue={filters.plan || ''}
                        />

                        <Select
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'active', label: 'Active' },
                                { value: 'expired', label: 'Expired' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            defaultValue={filters.status || ''}
                        />
                    </div>
                </Card>

                {/* Subscriptions Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Plan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Expires
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {subscriptions.data.map((sub) => (
                                    <tr
                                        key={sub.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {sub.name}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <Badge
                                                variant="light"
                                                color={getPlanBadgeColor(
                                                    sub.subscription_plan,
                                                )}
                                            >
                                                {sub.subscription_plan}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <Badge
                                                variant="light"
                                                color={
                                                    sub.is_active
                                                        ? 'success'
                                                        : 'error'
                                                }
                                            >
                                                {sub.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(sub.subscription_ends_at)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(sub.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {subscriptions.data.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No subscriptions found
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
