import type { FC } from 'react';
import { Briefcase } from 'lucide-react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Combobox from '@/components/form/Combobox';
import InputError from '@/components/form/InputError';
import type { CreateStaffFormData, Role } from '@/types/staff';
import {
    EMPLOYMENT_TYPE_OPTIONS,
    COMMON_POSITIONS,
    COMMON_DEPARTMENTS,
    requiresEndDate,
} from '@/types/staff';

interface EmploymentSectionProps {
    data: CreateStaffFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof CreateStaffFormData>(
        field: K,
        value: CreateStaffFormData[K],
    ) => void;
    roles: Role[];
    departments?: string[];
}

const EmploymentSection: FC<EmploymentSectionProps> = ({
    data,
    errors,
    onChange,
    roles,
    departments = [...COMMON_DEPARTMENTS],
}) => {
    const roleOptions = roles.map((role) => ({
        value: role.value,
        label: role.label,
        description: role.description,
    }));

    const employmentTypeOptions = EMPLOYMENT_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
    }));

    const positionOptions = COMMON_POSITIONS.map((pos) => ({
        value: pos,
        label: pos,
    }));

    const departmentOptions = departments.map((dept) => ({
        value: dept,
        label: dept,
    }));

    const showEndDate = requiresEndDate(data.employment_type);

    return (
        <CollapsibleSection
            title="Employment Details"
            description="Role, position, and employment terms"
            icon={Briefcase}
            defaultOpen={true}
        >
            <div className="space-y-4">
                <div>
                    <Label htmlFor="role" required>
                        Role
                    </Label>
                    <Select
                        name="role"
                        value={data.role}
                        onChange={(value) => onChange('role', value)}
                        options={roleOptions}
                        placeholder="Select a role"
                        error={!!errors.role}
                    />
                    <InputError message={errors.role} />
                    {data.role && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {roles.find((r) => r.value === data.role)?.description}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="employment_type" required>
                            Employment Type
                        </Label>
                        <Select
                            name="employment_type"
                            value={data.employment_type}
                            onChange={(value) =>
                                onChange(
                                    'employment_type',
                                    value as CreateStaffFormData['employment_type'],
                                )
                            }
                            options={employmentTypeOptions}
                            placeholder="Select type"
                            error={!!errors.employment_type}
                        />
                        <InputError message={errors.employment_type} />
                    </div>

                    <div>
                        <Label htmlFor="position_title" required>
                            Position / Job Title
                        </Label>
                        <Combobox
                            id="position_title"
                            name="position_title"
                            value={data.position_title}
                            onChange={(value) => onChange('position_title', value)}
                            options={positionOptions}
                            placeholder="Select or enter position"
                            allowCustom
                            error={!!errors.position_title}
                        />
                        <InputError message={errors.position_title} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="department" optional>
                        Department
                    </Label>
                    <Combobox
                        id="department"
                        name="department"
                        value={data.department}
                        onChange={(value) => onChange('department', value)}
                        options={departmentOptions}
                        placeholder="Select or enter department"
                        allowCustom
                        error={!!errors.department}
                    />
                    <InputError message={errors.department} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="start_date" required>
                            Start Date
                        </Label>
                        <Input
                            id="start_date"
                            name="start_date"
                            type="date"
                            value={data.start_date}
                            onChange={(e) => onChange('start_date', e.target.value)}
                            error={!!errors.start_date}
                        />
                        <InputError message={errors.start_date} />
                    </div>

                    {showEndDate && (
                        <div>
                            <Label htmlFor="end_date" required>
                                End Date
                            </Label>
                            <Input
                                id="end_date"
                                name="end_date"
                                type="date"
                                value={data.end_date || ''}
                                onChange={(e) =>
                                    onChange('end_date', e.target.value || null)
                                }
                                error={!!errors.end_date}
                                min={data.start_date}
                            />
                            <InputError message={errors.end_date} />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Required for {data.employment_type.replace('_', ' ')}{' '}
                                employees
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default EmploymentSection;
