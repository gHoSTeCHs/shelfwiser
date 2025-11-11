import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import AppLayout from '@/layouts/AppLayout';
import { User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    ChevronLeft,
    Edit,
    Mail,
    Shield,
    User as UserIcon,
} from 'lucide-react';

interface Shop {
    id: number;
    name: string;
    slug: string;
}

interface StaffMember extends User {
    shops: Shop[];
}

interface Props {
    staff: StaffMember;
}

export default function Show({ staff }: Props) {
    const getRoleBadgeColor = (role: string): string => {
        const colorMap: Record<
            string,
            'success' | 'info' | 'warning' | 'error'
        > = {
            owner: 'error',
            general_manager: 'info',
            store_manager: 'success',
            assistant_manager: 'warning',
            sales_rep: 'info',
            cashier: 'warning',
            inventory_clerk: 'info',
        };
        return colorMap[role] || 'info';
    };

    const getRoleLabel = (role: string): string => {
        const labelMap: Record<string, string> = {
            owner: 'Owner',
            general_manager: 'General Manager',
            store_manager: 'Store Manager',
            assistant_manager: 'Assistant Manager',
            sales_rep: 'Sales Representative',
            cashier: 'Cashier',
            inventory_clerk: 'Inventory Clerk',
        };
        return labelMap[role] || role;
    };

    return (
        <AppLayout>
            <Head title={`${staff.name} - Staff Details`} />

            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={'/staff'}
                            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Staff
                        </Link>
                    </div>

                    <Link href={`/staff/${staff.id}/edit`}>
                        <Button size="sm" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Staff
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                            <span className="text-xl font-bold">
                                {staff.first_name[0]}
                                {staff.last_name[0]}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {staff.name}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                <Badge
                                    variant="light"
                                    color={getRoleBadgeColor(staff.role)}
                                >
                                    {getRoleLabel(staff.role)}
                                </Badge>
                                {staff.is_tenant_owner && (
                                    <Badge variant="light" color="error">
                                        Tenant Owner
                                    </Badge>
                                )}
                                <Badge
                                    variant="light"
                                    color={
                                        staff.is_active ? 'success' : 'error'
                                    }
                                >
                                    {staff.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card title="Personal Information">
                            <div className="p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <UserIcon className="h-5 w-5" />
                                    Personal Information
                                </h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            First Name
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {staff.first_name}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Last Name
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {staff.last_name}
                                        </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Email Address
                                        </label>
                                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                            <Mail className="h-4 w-4" />
                                            <a
                                                href={`mailto:${staff.email}`}
                                                className="hover:text-blue-600 dark:hover:text-blue-400"
                                            >
                                                {staff.email}
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Role & Permissions">
                            <div className="p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <Shield className="h-5 w-5" />
                                    Role & Permissions
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Role
                                        </label>
                                        <div className="mt-1">
                                            <Badge
                                                variant="light"
                                                color={getRoleBadgeColor(
                                                    staff.role,
                                                )}
                                            >
                                                {getRoleLabel(staff.role)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Account Status
                                        </label>
                                        <div className="mt-1">
                                            <Badge
                                                variant="light"
                                                color={
                                                    staff.is_active
                                                        ? 'success'
                                                        : 'error'
                                                }
                                            >
                                                {staff.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {staff.email_verified_at && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Email Verified
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {new Date(
                                                    staff.email_verified_at,
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card title="Assigned Shops">
                            <div className="p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <Building2 className="h-5 w-5" />
                                    Assigned Shops
                                </h2>

                                {staff.shops && staff.shops.length > 0 ? (
                                    <div className="space-y-3">
                                        {staff.shops.map((shop) => (
                                            <Link
                                                key={shop.id}
                                                href={`/shops/${shop.id}`}
                                                className="block"
                                            >
                                                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {shop.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {shop.slug}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronLeft className="h-5 w-5 rotate-180 text-gray-400" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            No shops assigned
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Timeline">
                            <div className="p-6">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <Calendar className="h-5 w-5" />
                                    Timeline
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Joined
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(
                                                staff.created_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Last Updated
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(
                                                staff.updated_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-3">
                            <Link href={`/staff/${staff.id}/edit`}>
                                <Button className="w-full gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit Staff Member
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
