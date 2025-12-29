import { useState, useCallback } from 'react';
import { Head, Link, Form } from '@inertiajs/react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import StaffManagementController from '@/actions/App/Http/Controllers/Web/StaffManagementController.ts';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/ui/button/Button';
import type {
    StaffCreatePageProps,
    CreateStaffFormData,
    EmployeeTemplate,
} from '@/types/staff';
import {
    DEFAULT_STAFF_FORM_DATA,
    applyTemplateToForm,
} from '@/types/staff';
import {
    PersonalInfoSection,
    EmploymentSection,
    CompensationSection,
    DeductionsSection,
    BankingSection,
    ShopAssignmentSection,
    TemplateSelector,
} from './components';

export default function Create({
    roles,
    shops,
    payCalendars,
    departments,
    templates,
}: StaffCreatePageProps) {
    const [formData, setFormData] = useState<CreateStaffFormData>(DEFAULT_STAFF_FORM_DATA);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    const handleChange = useCallback(
        <K extends keyof CreateStaffFormData>(
            field: K,
            value: CreateStaffFormData[K],
        ) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    const handleTemplateSelect = useCallback((template: EmployeeTemplate) => {
        setSelectedTemplateId(template.id);
        setFormData((prev) => applyTemplateToForm(template, prev));
    }, []);

    return (
        <>
            <Head title="Add Staff Member" />

            <div className="mx-auto max-w-4xl space-y-6 px-4 pb-8 sm:px-6">
                <div className="pt-2">
                    <Link
                        href={StaffManagementController.index.url()}
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Staff
                    </Link>

                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                            <UserPlus className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                                Add Staff Member
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Create a new staff account with payroll details
                            </p>
                        </div>
                    </div>
                </div>

                <Form
                    action={StaffManagementController.store.url()}
                    method="post"
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            {templates.length > 0 && (
                                <TemplateSelector
                                    templates={templates}
                                    selectedTemplateId={selectedTemplateId}
                                    onSelect={handleTemplateSelect}
                                    disabled={processing}
                                />
                            )}

                            <PersonalInfoSection
                                data={formData}
                                errors={errors}
                                onChange={handleChange}
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
                                        disabled={processing || !formData.role}
                                        className="w-full sm:w-auto"
                                    >
                                        {processing ? (
                                            <>
                                                <Save className="mr-2 h-4 w-4 animate-pulse" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Create Staff Member
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {!formData.role && (
                                    <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400 sm:text-left">
                                        Please select a role to enable form submission
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
