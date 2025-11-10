import StaffManagementController from '@/actions/App/Http/Controllers/Web/StaffManagementController.ts';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Mail, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
    slug: string;
}

interface StaffMember extends User {
    shops: Shop[];
}

interface Statistics {
    total_staff: number;
    active_staff: number;
    inactive_staff: number;
    role_distribution: Record<string, number>;
}

interface Props {
    staff: StaffMember[];
    statistics: Statistics;
    shops: Shop[];
    roles: Record<string, string>;
    filters: {
        role?: string;
        shop_id?: number;
        is_active?: boolean;
    };
}

const StaffManagement = ({
    staff,
    statistics,
    shops,
    roles,
    filters,
}: Props) => {
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedShop, setSelectedShop] = useState(
        filters.shop_id?.toString() || '',
    );
    const [activeFilter, setActiveFilter] = useState(
        filters.is_active?.toString() || '',
    );

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        if (selectedRole) params.role = selectedRole;
        if (selectedShop) params.shop_id = selectedShop;
        if (activeFilter) params.is_active = activeFilter;

        router.get('/staff', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSelectedRole('');
        setSelectedShop('');
        setActiveFilter('');
        router.get('/staff', {}, { preserveState: true, preserveScroll: true });
    };

    const getRoleBadgeColor = (role: string): string => {
        const colorMap: Record<string, string> = {
            owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            general_manager:
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            store_manager:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            assistant_manager:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            sales_rep:
                'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
            cashier: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            inventory_clerk:
                'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
        };
        return (
            colorMap[role] ||
            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        );
    };

    return (
        <div className="h-screen">
            <Head title="Staff Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Staff Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage team members, roles, and permissions
                        </p>
                    </div>
                    <Link href={StaffManagementController.create.url()}>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Staff Member
                        </Button>
                    </Link>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Staff
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {statistics.total_staff}
                                </p>
                            </div>
                            <div className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/20">
                                <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Active
                                </p>
                                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                                    {statistics.active_staff}
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Inactive
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-400">
                                    {statistics.inactive_staff}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/20">
                                <Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Role Distribution
                            </p>
                            <div className="mt-2 space-y-1">
                                {Object.entries(
                                    statistics.role_distribution,
                                ).map(([role, count]) => (
                                    <div
                                        key={role}
                                        className="flex justify-between text-sm"
                                    >
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {role}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-6">
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Role
                            </label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Roles</option>
                                {Object.entries(roles).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Status</option>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                onClick={handleFilterChange}
                                className="flex-1"
                            >
                                Apply Filters
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

                {/* Staff List */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Staff Member
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Assigned Shops
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
                                {staff.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                                No staff members found
                                            </p>
                                            <Link
                                                href={
                                                    StaffManagementController
                                                        .create.url()
                                                }
                                            >
                                                <Button className="mt-4">
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Add First Staff Member
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    staff.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                                                        <span className="text-sm font-semibold">
                                                            {member.first_name[0]}
                                                            {member.last_name[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {member.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <Mail className="h-3 w-3" />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                                                >
                                                    {roles[member.role]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {member.shops.length === 0 ? (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        No shops assigned
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {member.shops.map(
                                                            (shop) => (
                                                                <span
                                                                    key={shop.id}
                                                                    className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                                >
                                                                    {shop.name}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {member.is_active ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/staff/${member.id}/edit`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Edit
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

StaffManagement.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default StaffManagement;
