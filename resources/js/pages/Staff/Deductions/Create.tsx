import { Head, Form, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Checkbox from '@/components/form/input/Checkbox';
import EmployeeCustomDeductionController from '@/actions/App/Http/Controllers/EmployeeCustomDeductionController';
import { User } from '@/types/payroll';
import { ArrowLeft } from 'lucide-react';

interface DeductionTypeOption {
    value: string;
    label: string;
}

interface Props {
    employee: Pick<User, 'id' | 'name' | 'email'>;
    deductionTypes: DeductionTypeOption[];
}

export default function Create({ employee, deductionTypes }: Props) {
    const [deductionName, setDeductionName] = useState('');
    const [deductionType, setDeductionType] = useState('');
    const [amount, setAmount] = useState('');
    const [percentage, setPercentage] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo, setEffectiveTo] = useState('');

    const isPercentageType = deductionType === 'percentage';
    const requiresAmount = !isPercentageType && deductionType !== '';

    return (
        <AppLayout>
            <Head title={`Add Deduction - ${employee.name}`} />

            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() =>
                        router.visit(
                            EmployeeCustomDeductionController.index.url({ employee: employee.id })
                        )
                    }
                    className="mb-4"
                >
                    Back to Deductions
                </Button>

                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Add Custom Deduction</h1>
                    <p className="mt-1 text-sm text-dark-600">
                        Create a new custom deduction for {employee.name}
                    </p>
                </div>
            </div>

            <Form
                action={EmployeeCustomDeductionController.store.url({ employee: employee.id })}
                method="post"
            >
                {({ errors, processing }) => (
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Deduction Name */}
                            <div>
                                <Label htmlFor="deduction_name">
                                    Deduction Name <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    name="deduction_name"
                                    id="deduction_name"
                                    placeholder="e.g., Housing Loan, Car Loan, Insurance Premium"
                                    value={deductionName}
                                    onChange={(e) => setDeductionName(e.target.value)}
                                    error={!!errors.deduction_name}
                                    required
                                />
                                <InputError message={errors.deduction_name} />
                            </div>

                            {/* Deduction Type */}
                            <div>
                                <Label htmlFor="deduction_type">
                                    Deduction Type <span className="text-error-500">*</span>
                                </Label>
                                <Select
                                    options={[
                                        { value: '', label: 'Select deduction type' },
                                        ...deductionTypes.map((dt) => ({
                                            value: dt.value,
                                            label: dt.label,
                                        })),
                                    ]}
                                    onChange={(value) => setDeductionType(value)}
                                    defaultValue=""
                                />
                                <input type="hidden" name="deduction_type" value={deductionType} />
                                <InputError message={errors.deduction_type} />
                            </div>

                            {/* Amount or Percentage */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                {isPercentageType ? (
                                    <div>
                                        <Label htmlFor="percentage">
                                            Percentage <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            name="percentage"
                                            id="percentage"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={percentage}
                                            onChange={(e) => setPercentage(e.target.value)}
                                            error={!!errors.percentage}
                                            hint="Percentage of gross salary (0-100)"
                                            required
                                        />
                                        <InputError message={errors.percentage} />
                                    </div>
                                ) : requiresAmount ? (
                                    <div>
                                        <Label htmlFor="amount">
                                            Amount (₦) <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            name="amount"
                                            id="amount"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            error={!!errors.amount}
                                            required
                                        />
                                        <InputError message={errors.amount} />
                                    </div>
                                ) : null}
                            </div>

                            {/* Effective Period */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="effective_from">
                                        Effective From <span className="text-error-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        name="effective_from"
                                        id="effective_from"
                                        value={effectiveFrom}
                                        onChange={(e) => setEffectiveFrom(e.target.value)}
                                        error={!!errors.effective_from}
                                        required
                                    />
                                    <InputError message={errors.effective_from} />
                                </div>

                                <div>
                                    <Label htmlFor="effective_to">Effective To (Optional)</Label>
                                    <Input
                                        type="date"
                                        name="effective_to"
                                        id="effective_to"
                                        value={effectiveTo}
                                        onChange={(e) => setEffectiveTo(e.target.value)}
                                        error={!!errors.effective_to}
                                        hint="Leave blank for ongoing deduction"
                                    />
                                    <InputError message={errors.effective_to} />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="is_active"
                                    name="is_active"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">
                                    Active (deduction will be applied to payroll)
                                </Label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 border-t border-dark-200 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.visit(
                                            EmployeeCustomDeductionController.index.url({
                                                employee: employee.id,
                                            })
                                        )
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    loading={processing}
                                >
                                    {processing ? 'Creating...' : 'Create Deduction'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </Form>
        </AppLayout>
    );
}
