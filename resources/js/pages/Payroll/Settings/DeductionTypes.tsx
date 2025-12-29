import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Checkbox from '@/components/form/input/Checkbox';
import Badge from '@/components/ui/badge/Badge';
import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import PayrollSettingsController from '@/actions/App/Http/Controllers/PayrollSettingsController';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    X,
    MinusCircle,
    Lock,
} from 'lucide-react';
import type { DeductionTypeModel, EnumOption } from '@/types/payroll';

interface Props {
    deductionTypes: DeductionTypeModel[];
    categories: EnumOption[];
    calculationTypes: EnumOption[];
    calculationBases: EnumOption[];
}

export default function DeductionTypes({
    deductionTypes,
    categories,
    calculationTypes,
    calculationBases,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<DeductionTypeModel | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        category: 'voluntary',
        calculation_type: 'fixed',
        calculation_base: 'gross',
        default_amount: '',
        default_rate: '',
        max_amount: '',
        annual_cap: '',
        is_pre_tax: false,
        is_mandatory: false,
        is_active: true,
        priority: '50',
    });

    const openCreateModal = () => {
        form.reset();
        setEditingType(null);
        setShowModal(true);
    };

    const openEditModal = (type: DeductionTypeModel) => {
        setEditingType(type);
        form.setData({
            code: type.code,
            name: type.name,
            description: type.description || '',
            category: type.category,
            calculation_type: type.calculation_type,
            calculation_base: type.calculation_base,
            default_amount: type.default_amount,
            default_rate: type.default_rate,
            max_amount: type.max_amount || '',
            annual_cap: type.annual_cap || '',
            is_pre_tax: type.is_pre_tax,
            is_mandatory: type.is_mandatory,
            is_active: type.is_active,
            priority: type.priority.toString(),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingType(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingType) {
            form.put(
                PayrollSettingsController.updateDeductionType.url({ deductionType: editingType.id }),
                {
                    onSuccess: () => closeModal(),
                }
            );
        } else {
            form.post(PayrollSettingsController.storeDeductionType.url(), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        setErrorMessage(null);
        router.delete(PayrollSettingsController.destroyDeductionType.url({ deductionType: id }), {
            onSuccess: () => setDeleteConfirm(null),
            onError: (errors) => {
                setDeleteConfirm(null);
                setErrorMessage(Object.values(errors).flat().join(', ') || 'Failed to delete deduction type');
            },
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'statutory':
                return 'error';
            case 'voluntary':
                return 'info';
            case 'loan':
                return 'warning';
            case 'advance':
                return 'warning';
            case 'benefit':
                return 'success';
            default:
                return 'light';
        }
    };

    return (
        <>
            <Head title="Deduction Types" />

            <div className="mb-6">
                <Link href={PayrollController.index.url()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        startIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back to Payroll
                    </Button>
                </Link>
            </div>

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Deduction Types
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure the types of deductions that can be applied to payroll
                    </p>
                </div>

                <Button
                    variant="primary"
                    startIcon={<Plus className="h-4 w-4" />}
                    onClick={openCreateModal}
                >
                    Add Deduction Type
                </Button>
            </div>

            {errorMessage && (
                <div className="mb-6 rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
                    <div className="flex items-center gap-3">
                        <span className="text-error-600 dark:text-error-400">{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="ml-auto inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-error-600 hover:text-error-800 dark:text-error-400"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Category
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                    Calculation
                                </th>
                                <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                    Pre-Tax
                                </th>
                                <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                                    Priority
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                            {deductionTypes.map((type) => (
                                <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <div className="flex items-center gap-2">
                                            {type.is_system && (
                                                <Lock className="h-3 w-3 text-gray-400" />
                                            )}
                                            <span className="font-mono text-sm text-gray-900 dark:text-white">
                                                {type.code}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {type.name}
                                            </span>
                                            {type.description && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {type.description}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge color={getCategoryColor(type.category)} size="sm">
                                            {type.category}
                                        </Badge>
                                    </td>
                                    <td className="hidden px-4 py-3 text-sm text-gray-600 dark:text-gray-300 md:table-cell">
                                        <div className="flex flex-col">
                                            <span>{type.calculation_type}</span>
                                            <span className="text-xs text-gray-400">
                                                Based on: {type.calculation_base}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 text-center md:table-cell">
                                        {type.is_pre_tax ? (
                                            <Badge color="info" size="sm">Yes</Badge>
                                        ) : (
                                            <Badge color="light" size="sm">No</Badge>
                                        )}
                                    </td>
                                    <td className="hidden px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300 md:table-cell">
                                        {type.priority}
                                    </td>
                                    <td className="px-4 py-3">
                                        {type.is_active ? (
                                            <Badge color="success" size="sm">Active</Badge>
                                        ) : (
                                            <Badge color="light" size="sm">Inactive</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!type.is_system && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(type)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {deleteConfirm === type.id ? (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(type.id)}
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDeleteConfirm(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteConfirm(type.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-error-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {type.is_system && (
                                            <span className="text-sm text-gray-400">System</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                                {editingType ? 'Edit Deduction Type' : 'Add Deduction Type'}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={closeModal}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 min-[480px]:grid-cols-2">
                                <div>
                                    <Label htmlFor="code">
                                        Code <span className="text-error-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        name="code"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                        placeholder="LOAN"
                                        error={!!form.errors.code}
                                    />
                                    <InputError message={form.errors.code} />
                                </div>

                                <div>
                                    <Label htmlFor="name">
                                        Name <span className="text-error-500">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="Staff Loan"
                                        error={!!form.errors.name}
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    type="text"
                                    name="description"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>

                            <div className="grid gap-4 min-[480px]:grid-cols-2">
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        options={categories.map((c) => ({
                                            value: c.value,
                                            label: c.label,
                                        }))}
                                        defaultValue={form.data.category}
                                        onChange={(value) => form.setData('category', value)}
                                    />
                                    <InputError message={form.errors.category} />
                                </div>

                                <div>
                                    <Label htmlFor="priority">Priority (1-100)</Label>
                                    <Input
                                        type="number"
                                        name="priority"
                                        value={form.data.priority}
                                        onChange={(e) => form.setData('priority', e.target.value)}
                                        min="1"
                                        max="100"
                                    />
                                    <InputError message={form.errors.priority} />
                                </div>
                            </div>

                            <div className="grid gap-4 min-[480px]:grid-cols-2">
                                <div>
                                    <Label htmlFor="calculation_type">Calculation Type</Label>
                                    <Select
                                        options={calculationTypes.map((c) => ({
                                            value: c.value,
                                            label: c.label,
                                        }))}
                                        defaultValue={form.data.calculation_type}
                                        onChange={(value) => form.setData('calculation_type', value)}
                                    />
                                    <InputError message={form.errors.calculation_type} />
                                </div>

                                <div>
                                    <Label htmlFor="calculation_base">Calculation Base</Label>
                                    <Select
                                        options={calculationBases.map((c) => ({
                                            value: c.value,
                                            label: c.label,
                                        }))}
                                        defaultValue={form.data.calculation_base}
                                        onChange={(value) => form.setData('calculation_base', value)}
                                    />
                                    <InputError message={form.errors.calculation_base} />
                                </div>
                            </div>

                            <div className="grid gap-4 min-[480px]:grid-cols-2">
                                <div>
                                    <Label htmlFor="default_amount">Default Amount</Label>
                                    <Input
                                        type="number"
                                        name="default_amount"
                                        value={form.data.default_amount}
                                        onChange={(e) => form.setData('default_amount', e.target.value)}
                                        step="0.01"
                                    />
                                    <InputError message={form.errors.default_amount} />
                                </div>

                                <div>
                                    <Label htmlFor="default_rate">Default Rate (%)</Label>
                                    <Input
                                        type="number"
                                        name="default_rate"
                                        value={form.data.default_rate}
                                        onChange={(e) => form.setData('default_rate', e.target.value)}
                                        step="0.01"
                                    />
                                    <InputError message={form.errors.default_rate} />
                                </div>
                            </div>

                            <div className="grid gap-4 min-[480px]:grid-cols-2">
                                <div>
                                    <Label htmlFor="max_amount">Max Amount (per period)</Label>
                                    <Input
                                        type="number"
                                        name="max_amount"
                                        value={form.data.max_amount}
                                        onChange={(e) => form.setData('max_amount', e.target.value)}
                                        step="0.01"
                                        placeholder="No limit"
                                    />
                                    <InputError message={form.errors.max_amount} />
                                </div>

                                <div>
                                    <Label htmlFor="annual_cap">Annual Cap</Label>
                                    <Input
                                        type="number"
                                        name="annual_cap"
                                        value={form.data.annual_cap}
                                        onChange={(e) => form.setData('annual_cap', e.target.value)}
                                        step="0.01"
                                        placeholder="No cap"
                                    />
                                    <InputError message={form.errors.annual_cap} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="is_pre_tax"
                                        checked={form.data.is_pre_tax}
                                        onChange={(e) => form.setData('is_pre_tax', e.target.checked)}
                                    />
                                    <Label htmlFor="is_pre_tax" className="mb-0">
                                        Pre-tax deduction (reduces taxable income)
                                    </Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="is_mandatory"
                                        checked={form.data.is_mandatory}
                                        onChange={(e) => form.setData('is_mandatory', e.target.checked)}
                                    />
                                    <Label htmlFor="is_mandatory" className="mb-0">
                                        Mandatory (automatically applied to all employees)
                                    </Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="is_active"
                                        checked={form.data.is_active}
                                        onChange={(e) => form.setData('is_active', e.target.checked)}
                                    />
                                    <Label htmlFor="is_active" className="mb-0">
                                        Active
                                    </Label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 border-t pt-4 min-[480px]:flex-row min-[480px]:justify-end min-[480px]:gap-3">
                                <Button type="button" variant="outline" onClick={closeModal} className="w-full min-[480px]:w-auto">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={form.processing}
                                    loading={form.processing}
                                    className="w-full min-[480px]:w-auto"
                                >
                                    {editingType ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </>
    );
}

DeductionTypes.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
