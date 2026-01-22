import ShopController from '@/actions/App/Http/Controllers/ShopController';
import { show as showTaxSettings } from '@/actions/App/Http/Controllers/Web/EmployeeTaxSettingsController';
import StaffManagementController from '@/actions/App/Http/Controllers/Web/StaffManagementController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import AppLayout from '@/layouts/AppLayout';
import { User } from '@/types';
import {
    EmployeeCustomDeduction,
    EmployeePayrollDetail,
    EmployeeTaxSettings,
    TaxConfigurationStatus,
} from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    ChevronLeft,
    CreditCard,
    DollarSign,
    Edit,
    Home,
    Mail,
    Plus,
    Receipt,
    Settings,
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
    employeePayrollDetail?: EmployeePayrollDetail;
    taxSettings?: EmployeeTaxSettings;
    customDeductions?: EmployeeCustomDeduction[];
}

interface Props {
    staff: StaffMember;
    canManagePayroll: boolean;
    canManageDeductions: boolean;
    taxConfigurationStatus: TaxConfigurationStatus;
}

export default function Show({
    staff,
    canManagePayroll,
    canManageDeductions,
    taxConfigurationStatus,
}: Props) {
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

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(parseFloat(amount.toString()));
    };

    const formatEmploymentType = (type: string) => {
        return type
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const hasPayrollDetails = !!staff.employeePayrollDetail;
    const activeCustomDeductions =
        staff.customDeductions?.filter((d) => d.is_active) || [];
    const totalActiveDeductions = activeCustomDeductions.length;

    return (
        <>
            <Head title={`${staff.name} - Staff Details`} />

            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={StaffManagementController.index.url()}
                            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Staff
                        </Link>
                    </div>

                    <Link
                        href={StaffManagementController.edit.url({
                            staff: staff.id,
                        })}
                    >
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
                                {staff.onboarding_status && (
                                    <Badge
                                        variant="light"
                                        color={
                                            staff.onboarding_status ===
                                            'completed'
                                                ? 'success'
                                                : staff.onboarding_status ===
                                                    'in_progress'
                                                  ? 'warning'
                                                  : 'light'
                                        }
                                    >
                                        {staff.onboarding_status === 'completed'
                                            ? 'Onboarded'
                                            : staff.onboarding_status ===
                                                'in_progress'
                                              ? 'Onboarding'
                                              : 'Pending Setup'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Personal Information */}
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

                        {/* Payroll Details */}
                        <Card title="Payroll Details">
                            <div className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        <DollarSign className="h-5 w-5" />
                                        Payroll Details
                                    </h2>
                                    {canManagePayroll && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                router.visit(
                                                    StaffManagementController.edit.url(
                                                        { staff: staff.id },
                                                    ) + '#payroll',
                                                )
                                            }
                                        >
                                            {hasPayrollDetails
                                                ? 'Edit'
                                                : 'Set Up'}
                                        </Button>
                                    )}
                                </div>

                                {hasPayrollDetails ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Employment Type
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {formatEmploymentType(
                                                    staff.employeePayrollDetail
                                                        .employment_type,
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Pay Type
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {formatEmploymentType(
                                                    staff.employeePayrollDetail
                                                        .pay_type,
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Pay Amount
                                            </label>
                                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    staff.employeePayrollDetail
                                                        .pay_amount,
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Pay Frequency
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {formatEmploymentType(
                                                    staff.employeePayrollDetail
                                                        .pay_frequency,
                                                )}
                                            </p>
                                        </div>

                                        {staff.employeePayrollDetail
                                            .position_title && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Position
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {
                                                        staff
                                                            .employeePayrollDetail
                                                            .position_title
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {staff.employeePayrollDetail
                                            .department && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Department
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {
                                                        staff
                                                            .employeePayrollDetail
                                                            .department
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {staff.employeePayrollDetail
                                            .standard_hours_per_week && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Weekly Hours
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {
                                                        staff
                                                            .employeePayrollDetail
                                                            .standard_hours_per_week
                                                    }{' '}
                                                    hrs/week
                                                </p>
                                            </div>
                                        )}

                                        {staff.employeePayrollDetail
                                            .commission_rate && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Commission Rate
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {
                                                        staff
                                                            .employeePayrollDetail
                                                            .commission_rate
                                                    }
                                                    %
                                                    {staff.employeePayrollDetail
                                                        .commission_cap && (
                                                        <span className="text-gray-500">
                                                            {' '}
                                                            (cap:{' '}
                                                            {formatCurrency(
                                                                staff
                                                                    .employeePayrollDetail
                                                                    .commission_cap,
                                                            )}
                                                            )
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {staff.employeePayrollDetail
                                            .pay_calendar && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Pay Calendar
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {
                                                        staff
                                                            .employeePayrollDetail
                                                            .pay_calendar.name
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        <div className="sm:col-span-2">
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Deductions Enabled
                                            </label>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {staff.employeePayrollDetail
                                                    .pension_enabled && (
                                                    <Badge
                                                        color="info"
                                                        size="sm"
                                                    >
                                                        Pension (
                                                        {
                                                            staff
                                                                .employeePayrollDetail
                                                                .pension_employee_rate
                                                        }
                                                        %)
                                                    </Badge>
                                                )}
                                                {staff.employeePayrollDetail
                                                    .nhf_enabled && (
                                                    <Badge
                                                        color="info"
                                                        size="sm"
                                                    >
                                                        NHF
                                                        {staff
                                                            .employeePayrollDetail
                                                            .nhf_rate !=
                                                            null && (
                                                            <>
                                                                {' '}
                                                                (
                                                                {
                                                                    staff
                                                                        .employeePayrollDetail
                                                                        .nhf_rate
                                                                }
                                                                %)
                                                            </>
                                                        )}
                                                    </Badge>
                                                )}
                                                {staff.employeePayrollDetail
                                                    .nhis_enabled && (
                                                    <Badge
                                                        color="info"
                                                        size="sm"
                                                    >
                                                        NHIS (
                                                        {formatCurrency(
                                                            staff
                                                                .employeePayrollDetail
                                                                .nhis_amount ||
                                                                0,
                                                        )}
                                                        )
                                                    </Badge>
                                                )}
                                                {staff.employeePayrollDetail
                                                    .enable_tax_calculations && (
                                                    <Badge
                                                        color="info"
                                                        size="sm"
                                                    >
                                                        Income Tax
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                                        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            No payroll details configured
                                        </p>
                                        {canManagePayroll && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-4"
                                                onClick={() =>
                                                    router.visit(
                                                        StaffManagementController.edit.url(
                                                            { staff: staff.id },
                                                        ) + '#payroll',
                                                    )
                                                }
                                            >
                                                Set Up Payroll
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Custom Deductions */}
                        <Card title="Custom Deductions">
                            <div className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        <Receipt className="h-5 w-5" />
                                        Custom Deductions
                                        {totalActiveDeductions > 0 && (
                                            <Badge color="info" size="sm">
                                                {totalActiveDeductions} active
                                            </Badge>
                                        )}
                                    </h2>
                                    {canManageDeductions && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            startIcon={
                                                <Plus className="h-4 w-4" />
                                            }
                                            onClick={() =>
                                                router.visit(
                                                    StaffManagementController.deductions.url(
                                                        { staff: staff.id },
                                                    ),
                                                )
                                            }
                                        >
                                            Manage
                                        </Button>
                                    )}
                                </div>

                                {staff.customDeductions &&
                                staff.customDeductions.length > 0 ? (
                                    <div className="space-y-3">
                                        {staff.customDeductions
                                            .slice(0, 5)
                                            .map((deduction) => (
                                                <div
                                                    key={deduction.id}
                                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Receipt className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {
                                                                    deduction.deduction_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {deduction.deduction_type ===
                                                                'percentage'
                                                                    ? `${deduction.percentage}% of salary`
                                                                    : formatCurrency(
                                                                          deduction.amount,
                                                                      )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        color={
                                                            deduction.is_active
                                                                ? 'success'
                                                                : 'light'
                                                        }
                                                        size="sm"
                                                    >
                                                        {deduction.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        {staff.customDeductions.length > 5 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                fullWidth
                                                onClick={() =>
                                                    router.visit(
                                                        StaffManagementController.deductions.url(
                                                            { staff: staff.id },
                                                        ),
                                                    )
                                                }
                                            >
                                                View all{' '}
                                                {staff.customDeductions.length}{' '}
                                                deductions
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                                        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            No custom deductions configured
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Role & Permissions */}
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

                        {/* Assigned Shops */}
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
                                                href={ShopController.show.url({
                                                    shop: shop.id,
                                                })}
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
                        {/* Timeline */}
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

                                    {hasPayrollDetails &&
                                        staff.employeePayrollDetail
                                            .start_date && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Employment Start
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {new Date(
                                                        staff.employeePayrollDetail.start_date,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </Card>

                        {/* Tax Settings */}
                        <Card title="Tax Settings">
                            <div className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        <Receipt className="h-5 w-5" />
                                        Tax Settings
                                    </h3>
                                    <Badge
                                        color={taxConfigurationStatus.color}
                                        size="sm"
                                    >
                                        {taxConfigurationStatus.label}
                                    </Badge>
                                </div>

                                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                    {taxConfigurationStatus.status ===
                                    'not_configured' ? (
                                        <p>
                                            Tax settings have not been
                                            configured for this employee.
                                        </p>
                                    ) : (
                                        <>
                                            <div className="flex justify-between">
                                                <span>Housing Status</span>
                                                <span className="flex items-center gap-1 font-medium">
                                                    <Home className="h-3.5 w-3.5" />
                                                    {taxConfigurationStatus.is_homeowner
                                                        ? 'Homeowner'
                                                        : 'Renter'}
                                                </span>
                                            </div>
                                            {!taxConfigurationStatus.is_homeowner && (
                                                <div className="flex justify-between">
                                                    <span>Rent Proof</span>
                                                    <Badge
                                                        color={
                                                            taxConfigurationStatus.has_rent_proof
                                                                ? 'success'
                                                                : 'warning'
                                                        }
                                                        size="sm"
                                                    >
                                                        {taxConfigurationStatus.has_rent_proof
                                                            ? 'Valid'
                                                            : 'Missing'}
                                                    </Badge>
                                                </div>
                                            )}
                                            {staff.taxSettings
                                                ?.tax_id_number && (
                                                <div className="flex justify-between">
                                                    <span>Tax ID</span>
                                                    <span className="font-medium">
                                                        {
                                                            staff.taxSettings
                                                                .tax_id_number
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <Link
                                        href={showTaxSettings.url({
                                            user: staff.id,
                                        })}
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2"
                                        >
                                            <Settings className="h-4 w-4" />
                                            {taxConfigurationStatus.status ===
                                            'not_configured'
                                                ? 'Configure Tax Settings'
                                                : 'Manage Tax Settings'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                            <Link
                                href={StaffManagementController.edit.url({
                                    staff: staff.id,
                                })}
                            >
                                <Button className="w-full gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit Staff Member
                                </Button>
                            </Link>

                            {canManageDeductions && (
                                <Link
                                    href={StaffManagementController.deductions.url(
                                        { staff: staff.id },
                                    )}
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        Manage Deductions
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
