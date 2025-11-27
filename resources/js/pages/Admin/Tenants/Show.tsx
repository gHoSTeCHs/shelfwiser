import AppLayout from '@/layouts/AppLayout';
import AdminTenantController from '@/actions/App/Http/Controllers/Admin/AdminTenantController';
import { Head, Link, router, Form } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import {
    ArrowLeft,
    Edit,
    Clock,
    Users,
    Store,
    Package,
    Calendar,
    Mail,
    Phone,
    Building2,
    Power,
    Plus,
} from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    is_active: boolean;
    created_at: string;
}

interface Shop {
    id: number;
    name: string;
    is_active: boolean;
    created_at: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    owner_email: string;
    business_type: string | null;
    phone: string | null;
    subscription_plan: string;
    is_active: boolean;
    users_count: number;
    shops_count: number;
    max_users: number;
    max_shops: number;
    max_products: number;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    is_on_trial: boolean;
    has_active_subscription: boolean;
    remaining_days: number;
    created_at: string;
    updated_at: string;
    users: User[];
    shops: Shop[];
}

interface Props {
    tenant: Tenant;
}

export default function Show({ tenant }: Props) {
    const [extendDays, setExtendDays] = useState(30);

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

    const handleToggleActive = () => {
        router.post(`/admin/tenants/${tenant.id}/toggle-active`);
    };

    return (
        <AppLayout>
            <Head title={`Tenant: ${tenant.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/tenants">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {tenant.name}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {tenant.slug}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={tenant.is_active ? 'outline' : 'primary'}
                            size="sm"
                            onClick={handleToggleActive}
                            startIcon={<Power className="h-4 w-4" />}
                        >
                            {tenant.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Link href={`/admin/tenants/${tenant.id}/edit`}>
                            <Button size="sm" startIcon={<Edit className="h-4 w-4" />}>
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Tenant Details
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            Owner Email
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {tenant.owner_email}
                                        </p>
                                    </div>
                                </div>
                                {tenant.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Phone
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {tenant.phone}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {tenant.business_type && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Business Type
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {tenant.business_type}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            Created
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {tenant.created_at}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Users ({tenant.users_count})
                                </h3>
                            </div>
                            {tenant.users.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No users found
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                                    Name
                                                </th>
                                                <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                                    Role
                                                </th>
                                                <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {tenant.users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="py-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 text-gray-600 dark:text-gray-400">
                                                        {user.role_label}
                                                    </td>
                                                    <td className="py-2">
                                                        <Badge
                                                            color={user.is_active ? 'success' : 'error'}
                                                            size="sm"
                                                        >
                                                            {user.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Shops ({tenant.shops_count})
                                </h3>
                            </div>
                            {tenant.shops.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No shops found
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                                    Name
                                                </th>
                                                <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                                    Status
                                                </th>
                                                <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                                    Created
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {tenant.shops.map((shop) => (
                                                <tr key={shop.id}>
                                                    <td className="py-2 font-medium text-gray-900 dark:text-white">
                                                        {shop.name}
                                                    </td>
                                                    <td className="py-2">
                                                        <Badge
                                                            color={shop.is_active ? 'success' : 'error'}
                                                            size="sm"
                                                        >
                                                            {shop.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 text-gray-600 dark:text-gray-400">
                                                        {shop.created_at}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Subscription
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Plan
                                    </span>
                                    <Badge color={getPlanColor(tenant.subscription_plan)}>
                                        {tenant.subscription_plan}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Status
                                    </span>
                                    <Badge color={tenant.has_active_subscription ? 'success' : 'error'}>
                                        {tenant.has_active_subscription ? 'Active' : 'Expired'}
                                    </Badge>
                                </div>
                                {tenant.is_on_trial && tenant.trial_ends_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Trial Ends
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {tenant.trial_ends_at}
                                        </span>
                                    </div>
                                )}
                                {!tenant.is_on_trial && tenant.subscription_ends_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Subscription Ends
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {tenant.subscription_ends_at}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Days Remaining
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {tenant.remaining_days}
                                    </span>
                                </div>
                            </div>

                            <hr className="my-4 border-gray-200 dark:border-gray-700" />

                            <Form
                                action={`/admin/tenants/${tenant.id}/extend-subscription`}
                                method="post"
                            >
                                {({ processing }) => (
                                    <div>
                                        <Label htmlFor="days" className="text-sm">
                                            Extend Subscription
                                        </Label>
                                        <div className="mt-2 flex gap-2">
                                            <Input
                                                id="days"
                                                name="days"
                                                type="number"
                                                value={extendDays}
                                                onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                                                className="w-24"
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={processing}
                                                loading={processing}
                                                startIcon={<Plus className="h-3 w-3" />}
                                            >
                                                Add Days
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </Card>

                        <Card className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Limits
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Users
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {tenant.users_count} / {tenant.max_users}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Store className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Shops
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {tenant.shops_count} / {tenant.max_shops}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Products
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {tenant.max_products}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
