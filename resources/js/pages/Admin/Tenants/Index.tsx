import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Search, Building2, Eye, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    owner_email: string;
    subscription_plan: string;
    is_active: boolean;
    users_count: number;
    shops_count: number;
    max_users: number;
    max_shops: number;
    max_products: number;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    created_at: string;
}

interface Props {
    tenants: {
        data: Tenant[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        plan?: string;
        is_active?: string;
    };
}

export default function Index({ tenants, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/tenants', { ...filters, search }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (!value) delete newFilters[key as keyof typeof newFilters];
        router.get('/admin/tenants', newFilters, { preserveState: true });
    };

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
        <AppLayout>
            <Head title="Manage Tenants" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Tenants
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage all platform tenants and their subscriptions
                        </p>
                    </div>
                    <Link href="/admin/tenants/create">
                        <Button startIcon={<Plus className="h-4 w-4" />}>
                            Create Tenant
                        </Button>
                    </Link>
                </div>

                <Card className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search tenants..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </form>
                        <div className="flex gap-2">
                            <Select
                                options={[
                                    { value: '', label: 'All Plans' },
                                    { value: 'trial', label: 'Trial' },
                                    { value: 'basic', label: 'Basic' },
                                    { value: 'professional', label: 'Professional' },
                                    { value: 'enterprise', label: 'Enterprise' },
                                ]}
                                defaultValue={filters.plan || ''}
                                onChange={(value) => handleFilterChange('plan', value)}
                            />
                            <Select
                                options={[
                                    { value: '', label: 'All Status' },
                                    { value: '1', label: 'Active' },
                                    { value: '0', label: 'Inactive' },
                                ]}
                                defaultValue={filters.is_active || ''}
                                onChange={(value) => handleFilterChange('is_active', value)}
                            />
                        </div>
                    </div>
                </Card>

                {tenants.data.length === 0 ? (
                    <EmptyState
                        icon={<Building2 className="h-12 w-12" />}
                        title="No tenants found"
                        description="Get started by creating your first tenant."
                        action={
                            <Link href="/admin/tenants/create">
                                <Button startIcon={<Plus className="h-4 w-4" />}>
                                    Create Tenant
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Tenant
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Plan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Usage
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Created
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                    {tenants.data.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3">
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
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={getPlanColor(tenant.subscription_plan)}>
                                                    {tenant.subscription_plan}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="space-y-1">
                                                    <div>
                                                        Users: {tenant.users_count}/{tenant.max_users}
                                                    </div>
                                                    <div>
                                                        Shops: {tenant.shops_count}/{tenant.max_shops}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={tenant.is_active ? 'success' : 'error'}>
                                                    {tenant.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {tenant.created_at}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/tenants/${tenant.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/tenants/${tenant.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {tenants.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing page {tenants.current_page} of {tenants.last_page} ({tenants.total} total)
                                </div>
                                <div className="flex gap-1">
                                    {tenants.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`rounded px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-brand-600 text-white'
                                                    : link.url
                                                    ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                                    : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
