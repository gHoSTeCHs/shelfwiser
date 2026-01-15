import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import type { CreateStaffFormData, PayCalendar } from '@/types/staff';
import {
    PAY_FREQUENCY_OPTIONS,
    PAY_TYPE_OPTIONS,
    formatCurrency,
    isCommissionBased,
} from '@/types/staff';
import { Wallet } from 'lucide-react';
import type { FC } from 'react';

interface CompensationSectionProps {
    data: CreateStaffFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof CreateStaffFormData>(
        field: K,
        value: CreateStaffFormData[K],
    ) => void;
    payCalendars: PayCalendar[];
}

const CompensationSection: FC<CompensationSectionProps> = ({
    data,
    errors,
    onChange,
    payCalendars,
}) => {
    const payTypeOptions = PAY_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
    }));

    const payFrequencyOptions = PAY_FREQUENCY_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
    }));

    const payCalendarOptions = payCalendars.map((cal) => ({
        value: String(cal.id),
        label: cal.name,
    }));

    const showCommissionFields = isCommissionBased(data.pay_type);
    const isHourly = data.pay_type === 'hourly';
    const isDaily = data.pay_type === 'daily';

    const getPayAmountLabel = () => {
        if (isHourly) return 'Hourly Rate';
        if (isDaily) return 'Daily Rate';
        return 'Base Salary';
    };

    const getPayAmountHint = () => {
        if (!data.pay_amount) return '';
        const amount = parseFloat(data.pay_amount);
        if (isNaN(amount)) return '';

        if (isHourly && data.standard_hours_per_week) {
            const weeklyHours = parseFloat(data.standard_hours_per_week);
            const monthlyEstimate = amount * weeklyHours * 4.33;
            return `Estimated monthly: ${formatCurrency(monthlyEstimate)}`;
        }
        if (isDaily) {
            const monthlyEstimate = amount * 22;
            return `Estimated monthly (22 working days): ${formatCurrency(monthlyEstimate)}`;
        }
        return '';
    };

    return (
        <CollapsibleSection
            title="Compensation"
            description="Pay structure and salary details"
            icon={Wallet}
            defaultOpen={false}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="pay_type" required>
                            Pay Type
                        </Label>
                        <Select
                            name="pay_type"
                            value={data.pay_type}
                            onChange={(value) =>
                                onChange(
                                    'pay_type',
                                    value as CreateStaffFormData['pay_type'],
                                )
                            }
                            options={payTypeOptions}
                            placeholder="Select pay type"
                            error={!!errors.pay_type}
                        />
                        <InputError message={errors.pay_type} />
                    </div>

                    <div>
                        <Label htmlFor="pay_frequency" required>
                            Pay Frequency
                        </Label>
                        <Select
                            name="pay_frequency"
                            value={data.pay_frequency}
                            onChange={(value) =>
                                onChange(
                                    'pay_frequency',
                                    value as CreateStaffFormData['pay_frequency'],
                                )
                            }
                            options={payFrequencyOptions}
                            placeholder="Select frequency"
                            error={!!errors.pay_frequency}
                        />
                        <InputError message={errors.pay_frequency} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="pay_amount" required>
                            {getPayAmountLabel()}
                        </Label>
                        <div className="relative">
                            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                                ₦
                            </span>
                            <Input
                                id="pay_amount"
                                name="pay_amount"
                                type="number"
                                value={data.pay_amount}
                                onChange={(e) =>
                                    onChange('pay_amount', e.target.value)
                                }
                                error={!!errors.pay_amount}
                                placeholder="0.00"
                                className="pl-7"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <InputError message={errors.pay_amount} />
                        {getPayAmountHint() && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {getPayAmountHint()}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="standard_hours_per_week">
                            Standard Hours/Week
                        </Label>
                        <Input
                            id="standard_hours_per_week"
                            name="standard_hours_per_week"
                            type="number"
                            value={data.standard_hours_per_week}
                            onChange={(e) =>
                                onChange(
                                    'standard_hours_per_week',
                                    e.target.value,
                                )
                            }
                            error={!!errors.standard_hours_per_week}
                            placeholder="40"
                            min="1"
                            max="168"
                        />
                        <InputError message={errors.standard_hours_per_week} />
                    </div>
                </div>

                {payCalendars.length > 0 && (
                    <div>
                        <Label htmlFor="pay_calendar_id" optional>
                            Pay Calendar
                        </Label>
                        <Select
                            name="pay_calendar_id"
                            value={
                                data.pay_calendar_id
                                    ? String(data.pay_calendar_id)
                                    : ''
                            }
                            onChange={(value) =>
                                onChange(
                                    'pay_calendar_id',
                                    value ? parseInt(value) : null,
                                )
                            }
                            options={payCalendarOptions}
                            placeholder="Select pay calendar"
                            error={!!errors.pay_calendar_id}
                            allowClear
                        />
                        <InputError message={errors.pay_calendar_id} />
                    </div>
                )}

                {showCommissionFields && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                            Commission Settings
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="commission_rate">
                                    Commission Rate (%)
                                </Label>
                                <Input
                                    id="commission_rate"
                                    name="commission_rate"
                                    type="number"
                                    value={data.commission_rate || ''}
                                    onChange={(e) =>
                                        onChange(
                                            'commission_rate',
                                            e.target.value || null,
                                        )
                                    }
                                    error={!!errors.commission_rate}
                                    placeholder="e.g., 5"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <InputError message={errors.commission_rate} />
                            </div>

                            <div>
                                <Label htmlFor="commission_cap" optional>
                                    Commission Cap
                                </Label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                                        ₦
                                    </span>
                                    <Input
                                        id="commission_cap"
                                        name="commission_cap"
                                        type="number"
                                        value={data.commission_cap || ''}
                                        onChange={(e) =>
                                            onChange(
                                                'commission_cap',
                                                e.target.value || null,
                                            )
                                        }
                                        error={!!errors.commission_cap}
                                        placeholder="No cap"
                                        className="pl-7"
                                        min="0"
                                    />
                                </div>
                                <InputError message={errors.commission_cap} />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Maximum commission per pay period (leave
                                    empty for no cap)
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default CompensationSection;
