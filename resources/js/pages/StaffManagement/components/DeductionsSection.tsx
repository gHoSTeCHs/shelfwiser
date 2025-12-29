import type { FC } from 'react';
import { Calculator } from 'lucide-react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import InputError from '@/components/form/InputError';
import type { CreateStaffFormData } from '@/types/staff';
import { TAX_HANDLING_OPTIONS } from '@/types/staff';

interface DeductionsSectionProps {
    data: CreateStaffFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof CreateStaffFormData>(
        field: K,
        value: CreateStaffFormData[K],
    ) => void;
}

interface ToggleCardProps {
    id: string;
    name: string;
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

const ToggleCard: FC<ToggleCardProps> = ({
    id,
    name,
    title,
    description,
    checked,
    onChange,
    disabled = false,
    children,
}) => (
    <div
        className={`rounded-lg border p-4 transition-colors ${
            checked
                ? 'border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
        } ${disabled ? 'opacity-50' : ''}`}
    >
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
                <label
                    htmlFor={id}
                    className="text-sm font-medium text-gray-900 dark:text-white"
                >
                    {title}
                </label>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                    checked ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-600'
                } ${disabled ? 'cursor-not-allowed' : ''}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
            <input
                type="hidden"
                name={name}
                value={checked ? '1' : '0'}
            />
        </div>
        {checked && children && <div className="mt-3">{children}</div>}
    </div>
);

const DeductionsSection: FC<DeductionsSectionProps> = ({
    data,
    errors,
    onChange,
}) => {
    const taxHandlingOptions = TAX_HANDLING_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
    }));

    return (
        <CollapsibleSection
            title="Tax & Deductions"
            description="Tax handling and statutory deductions"
            icon={Calculator}
            defaultOpen={false}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="tax_handling" required>
                            Tax Handling
                        </Label>
                        <Select
                            name="tax_handling"
                            value={data.tax_handling}
                            onChange={(value) =>
                                onChange(
                                    'tax_handling',
                                    value as CreateStaffFormData['tax_handling'],
                                )
                            }
                            options={taxHandlingOptions}
                            placeholder="Select tax handling"
                            error={!!errors.tax_handling}
                        />
                        <InputError message={errors.tax_handling} />
                    </div>

                    <div>
                        <Label htmlFor="tax_id_number" optional>
                            Tax ID Number (TIN)
                        </Label>
                        <Input
                            id="tax_id_number"
                            name="tax_id_number"
                            type="text"
                            value={data.tax_id_number}
                            onChange={(e) => onChange('tax_id_number', e.target.value)}
                            error={!!errors.tax_id_number}
                            placeholder="Enter TIN"
                        />
                        <InputError message={errors.tax_id_number} />
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Statutory Deductions
                    </h4>

                    <ToggleCard
                        id="pension_enabled"
                        name="pension_enabled"
                        title="Pension (PFA)"
                        description="Contributory pension scheme deductions"
                        checked={data.pension_enabled}
                        onChange={(checked) => onChange('pension_enabled', checked)}
                    >
                        <div>
                            <Label htmlFor="pension_employee_rate">
                                Employee Contribution Rate (%)
                            </Label>
                            <Input
                                id="pension_employee_rate"
                                name="pension_employee_rate"
                                type="number"
                                value={data.pension_employee_rate}
                                onChange={(e) =>
                                    onChange('pension_employee_rate', e.target.value)
                                }
                                error={!!errors.pension_employee_rate}
                                placeholder="8"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <InputError message={errors.pension_employee_rate} />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Standard rate is 8% (employer contributes 10%)
                            </p>
                        </div>
                    </ToggleCard>

                    <ToggleCard
                        id="nhf_enabled"
                        name="nhf_enabled"
                        title="National Housing Fund (NHF)"
                        description="2.5% contribution for housing benefits"
                        checked={data.nhf_enabled}
                        onChange={(checked) => onChange('nhf_enabled', checked)}
                    />

                    <ToggleCard
                        id="nhis_enabled"
                        name="nhis_enabled"
                        title="National Health Insurance (NHIS)"
                        description="Health insurance coverage contributions"
                        checked={data.nhis_enabled}
                        onChange={(checked) => onChange('nhis_enabled', checked)}
                    />
                </div>

                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> Additional custom deductions can be
                        configured after the employee is created through the payroll
                        management section.
                    </p>
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default DeductionsSection;
