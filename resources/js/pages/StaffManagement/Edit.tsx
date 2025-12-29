import { useState, useCallback, useMemo } from 'react';
import { Head, Link, Form } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    UserCog,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
} from 'lucide-react';
import StaffManagementController from '@/actions/App/Http/Controllers/Web/StaffManagementController.ts';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import type {
    StaffEditPageProps,
    CreateStaffFormData,
} from '@/types/staff';
import {
    PersonalInfoSection,
    EmploymentSection,
    CompensationSection,
    DeductionsSection,
    BankingSection,
    ShopAssignmentSection,
} from './components';

export default function Edit({
    staff,
    roles,
    shops,
    payCalendars,
    departments,
    canManagePayroll,
}: StaffEditPageProps) {
    const initialFormData = useMemo<CreateStaffFormData>(() => {
        const payrollDetail = staff.employee_payroll_detail;
        return {
            first_name: staff.first_name,
            last_name: staff.last_name,
            email: staff.email,
            password: '',
            password_confirmation: '',
            role: staff.role,
            shop_ids: staff.shops.map((s) => s.id),
            send_invitation: false,
            employment_type: payrollDetail?.employment_type || 'full_time',
            position_title: payrollDetail?.position_title || '',
            department: payrollDetail?.department || '',
            start_date: payrollDetail?.start_date || new Date().toISOString().split('T')[0],
            end_date: payrollDetail?.end_date || null,
            pay_type: payrollDetail?.pay_type || 'salary',
            pay_amount: payrollDetail?.pay_amount || '',
            pay_frequency: payrollDetail?.pay_frequency || 'monthly',
            pay_calendar_id: payrollDetail?.pay_calendar_id || null,
            standard_hours_per_week: payrollDetail?.standard_hours_per_week || '40',
            commission_rate: payrollDetail?.commission_rate || null,
            commission_cap: payrollDetail?.commission_cap || null,
            tax_handling: payrollDetail?.tax_handling || 'shop_calculates',
            tax_id_number: payrollDetail?.tax_id_number || '',
            pension_enabled: payrollDetail?.pension_enabled || false,
            pension_employee_rate: payrollDetail?.pension_employee_rate || '8',
            nhf_enabled: payrollDetail?.nhf_enabled || false,
            nhis_enabled: payrollDetail?.nhis_enabled || false,
            bank_name: payrollDetail?.bank_name || '',
            bank_account_number: payrollDetail?.bank_account_number || '',
            routing_number: payrollDetail?.routing_number || '',
            emergency_contact_name: payrollDetail?.emergency_contact_name || '',
            emergency_contact_phone: payrollDetail?.emergency_contact_phone || '',
        };
    }, [staff]);

    const [formData, setFormData] = useState<CreateStaffFormData>(initialFormData);
    const [isActive, setIsActive] = useState(staff.is_active);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

    const handleChange = useCallback(
        <K extends keyof CreateStaffFormData>(
            field: K,
            value: CreateStaffFormData[K],
        ) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    const handleToggleActive = useCallback(() => {
        if (isActive) {
            setShowDeactivateConfirm(true);
        } else {
            setIsActive(true);
        }
    }, [isActive]);

    const confirmDeactivate = useCallback(() => {
        setIsActive(false);
        setShowDeactivateConfirm(false);
    }, []);

    const getOnboardingBadge = () => {
        switch (staff.onboarding_status) {
            case 'completed':
                return <Badge color="success">Onboarded</Badge>;
            case 'in_progress':
                return <Badge color="warning">Onboarding</Badge>;
            default:
                return <Badge color="light">Pending</Badge>;
        }
    };

    return (
        <>
            <Head title={`Edit ${staff.full_name}`} />

            <div className="mx-auto max-w-4xl space-y-6 px-4 pb-8 sm:px-6">
                <div className="pt-2">
                    <Link
                        href={StaffManagementController.index.url()}
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Staff
                    </Link>

                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                                <UserCog className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                                        {staff.full_name}
                                    </h1>
                                    {getOnboardingBadge()}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {staff.role_label} • {staff.email}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleActive}
                            disabled={staff.is_tenant_owner}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                staff.is_tenant_owner
                                    ? 'cursor-not-allowed opacity-50'
                                    : isActive
                                      ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                            }`}
                        >
                            {isActive ? (
                                <>
                                    <ToggleRight className="h-5 w-5" />
                                    <span className="hidden sm:inline">Active</span>
                                </>
                            ) : (
                                <>
                                    <ToggleLeft className="h-5 w-5" />
                                    <span className="hidden sm:inline">Inactive</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {showDeactivateConfirm && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                            <div className="flex-1">
                                <h3 className="font-medium text-red-800 dark:text-red-200">
                                    Deactivate Staff Member?
                                </h3>
                                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                    This will prevent {staff.first_name} from logging in and
                                    accessing the system. You can reactivate them later.
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={confirmDeactivate}
                                    >
                                        Deactivate
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowDeactivateConfirm(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Form
                    action={StaffManagementController.update.url({ staff: staff.id })}
                    method="put"
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <PersonalInfoSection
                                data={formData}
                                errors={errors}
                                onChange={handleChange}
                                isEdit
                            />

                            <ShopAssignmentSection
                                data={formData}
                                errors={errors}
                                onChange={handleChange}
                                shops={shops}
                                roles={roles}
                            />

                            <EmploymentSection
                                data={formData}
                                errors={errors}
                                onChange={handleChange}
                                roles={roles}
                                departments={departments}
                            />

                            {canManagePayroll && (
                                <>
                                    <CompensationSection
                                        data={formData}
                                        errors={errors}
                                        onChange={handleChange}
                                        payCalendars={payCalendars}
                                    />

                                    <DeductionsSection
                                        data={formData}
                                        errors={errors}
                                        onChange={handleChange}
                                    />

                                    <BankingSection
                                        data={formData}
                                        errors={errors}
                                        onChange={handleChange}
                                    />
                                </>
                            )}

                            {!canManagePayroll && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        <strong>Note:</strong> You don't have permission to
                                        manage payroll details. Contact a manager with payroll
                                        permissions to update compensation and banking
                                        information.
                                    </p>
                                </div>
                            )}

                            <input type="hidden" name="is_active" value={isActive ? '1' : '0'} />

                            <div className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95 sm:-mx-6 sm:px-6">
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Link href={StaffManagementController.index.url()} className="w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            disabled={processing}
                                            className="w-full sm:w-auto"
                                        >
                                            Cancel
                                        </Button>
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full sm:w-auto"
                                    >
                                        {processing ? (
                                            <>
                                                <Save className="mr-2 h-4 w-4 animate-pulse" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
