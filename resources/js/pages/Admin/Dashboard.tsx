import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import {
    Building2,
    Users,
    Store,
    Package,
    ShoppingCart,
    Clock,
    ArrowRight,
    AlertTriangle,
} from 'lucide-react';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    owner_email: string;
    subscription_plan: string;
    is_active: boolean;
    users_count: number;
    created_at: string;
}

interface ExpiringTrial {
    id: number;
    name: string;
    owner_email: string;
    trial_ends_at: string;
    days_remaining: number;
}

interface Props {
    stats: {
        total_tenants: number;
        active_tenants: number;
        trial_tenants: number;
        total_users: number;
        total_shops: number;
        total_products: number;
        total_orders: number;
    };
    subscriptionBreakdown: {
        trial: number;
        basic: number;
        professional: number;
        enterprise: number;
    };
    recentTenants: Tenant[];
    expiringTrials: ExpiringTrial[];
}

export default function Dashboard({
    stats,
    subscriptionBreakdown,
    recentTenants,
    expiringTrials,
}: Props) {
    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'trial':
                return 'warning';
            case 'basic':
                return 'info';
            case 'professional':
                return 'primary';
            case 'enterprise':
                return 'success';
            default:
                return 'light';
        }
    };

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Platform Administration
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage tenants, subscriptions, and platform settings
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/30">
                                <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Tenants
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_tenants}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {stats.active_tenants} active
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/30">
                                <Users className="h-5 w-5 text-success-600 dark:text-success-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Users
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_users}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/30">
                                <Store className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Shops
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_shops}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-info-100 p-3 dark:bg-info-900/30">
                                <ShoppingCart className="h-5 w-5 text-info-600 dark:text-info-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Orders
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_orders}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card className="p-4">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                            Subscription Breakdown
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Trial
                                </span>
                                <Badge color="warning">{subscriptionBreakdown.trial}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Basic
                                </span>
                                <Badge color="info">{subscriptionBreakdown.basic}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Professional
                                </span>
                                <Badge color="primary">{subscriptionBreakdown.professional}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Enterprise
                                </span>
                                <Badge color="success">{subscriptionBreakdown.enterprise}</Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="col-span-1 p-4 lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Recent Tenants
                            </h3>
                            <Link href="/admin/tenants">
                                <Button variant="ghost" size="sm" endIcon={<ArrowRight className="h-4 w-4" />}>
                                    View All
                                </Button>
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Name
                                        </th>
                                        <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Plan
                                        </th>
                                        <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Users
                                        </th>
                                        <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {recentTenants.map((tenant) => (
                                        <tr key={tenant.id}>
                                            <td className="py-2">
                                                <Link
                                                    href={`/admin/tenants/${tenant.id}`}
                                                    className="font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                                                >
                                                    {tenant.name}
                                                </Link>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {tenant.owner_email}
                                                </p>
                                            </td>
                                            <td className="py-2">
                                                <Badge
                                                    color={getPlanColor(tenant.subscription_plan)}
                                                    size="sm"
                                                >
                                                    {tenant.subscription_plan}
                                                </Badge>
                                            </td>
                                            <td className="py-2 text-gray-600 dark:text-gray-400">
                                                {tenant.users_count}
                                            </td>
                                            <td className="py-2">
                                                <Badge
                                                    color={tenant.is_active ? 'success' : 'error'}
                                                    size="sm"
                                                >
                                                    {tenant.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {expiringTrials.length > 0 && (
                    <Card className="border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                            <h3 className="font-semibold text-warning-800 dark:text-warning-200">
                                Expiring Trials
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {expiringTrials.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-800"
                                >
                                    <div>
                                        <Link
                                            href={`/admin/tenants/${tenant.id}`}
                                            className="font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                                        >
                                            {tenant.name}
                                        </Link>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {tenant.owner_email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-warning-600 dark:text-warning-400" />
                                        <span className="text-sm font-medium text-warning-700 dark:text-warning-300">
                                            {tenant.days_remaining} days left
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
