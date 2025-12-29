import type { FC } from 'react';
import { User } from 'lucide-react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import type { CreateStaffFormData } from '@/types/staff';

interface PersonalInfoSectionProps {
    data: CreateStaffFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof CreateStaffFormData>(
        field: K,
        value: CreateStaffFormData[K],
    ) => void;
    isEdit?: boolean;
}

const PersonalInfoSection: FC<PersonalInfoSectionProps> = ({
    data,
    errors,
    onChange,
    isEdit = false,
}) => {
    return (
        <CollapsibleSection
            title="Personal Information"
            description="Basic details about the staff member"
            icon={User}
            defaultOpen={true}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="first_name" required>
                            First Name
                        </Label>
                        <Input
                            id="first_name"
                            name="first_name"
                            type="text"
                            value={data.first_name}
                            onChange={(e) => onChange('first_name', e.target.value)}
                            error={!!errors.first_name}
                            placeholder="Enter first name"
                        />
                        <InputError message={errors.first_name} />
                    </div>

                    <div>
                        <Label htmlFor="last_name" required>
                            Last Name
                        </Label>
                        <Input
                            id="last_name"
                            name="last_name"
                            type="text"
                            value={data.last_name}
                            onChange={(e) => onChange('last_name', e.target.value)}
                            error={!!errors.last_name}
                            placeholder="Enter last name"
                        />
                        <InputError message={errors.last_name} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="email" required>
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        error={!!errors.email}
                        placeholder="staff@example.com"
                    />
                    <InputError message={errors.email} />
                </div>

                {!isEdit && (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="password" required>
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => onChange('password', e.target.value)}
                                    error={!!errors.password}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div>
                                <Label htmlFor="password_confirmation" required>
                                    Confirm Password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        onChange('password_confirmation', e.target.value)
                                    }
                                    error={!!errors.password_confirmation}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                            <input
                                type="checkbox"
                                id="send_invitation"
                                name="send_invitation"
                                checked={data.send_invitation}
                                onChange={(e) =>
                                    onChange('send_invitation', e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600"
                            />
                            <label
                                htmlFor="send_invitation"
                                className="text-sm text-gray-700 dark:text-gray-300"
                            >
                                Send invitation email to the staff member
                            </label>
                        </div>
                    </>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default PersonalInfoSection;
