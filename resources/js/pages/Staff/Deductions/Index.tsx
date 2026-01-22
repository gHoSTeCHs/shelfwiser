import EmployeeCustomDeductionController from '@/actions/App/Http/Controllers/EmployeeCustomDeductionController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { EmployeeCustomDeduction, User } from '@/types/payroll';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    DollarSign,
    Edit,
    Plus,
    ToggleLeft,
    ToggleRight,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface DeductionTypeOption {
    value: string;
    label: string;
}

interface Props {
    employee: Pick<User, 'id' | 'name' | 'email'>;
    deductions: EmployeeCustomDeduction[];
    deductionTypes: DeductionTypeOption[];
}

export default function Index({ employee, deductions, deductionTypes }: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getDeductionTypeLabel = (type: string) => {
        return deductionTypes.find((dt) => dt.value === type)?.label || type;
    };

    const handleDelete = (deductionId: number) => {
        if (confirm('Are you sure you want to delete this deduction?')) {
            setDeletingId(deductionId);
            router.delete(
                EmployeeCustomDeductionController.destroy.url({
                    employee: employee.id,
                    deduction: deductionId,
                }),
                {
                    onFinish: () => setDeletingId(null),
                },
            );
        }
    };

    const handleToggleStatus = (deductionId: number) => {
        router.post(
            EmployeeCustomDeductionController.toggleStatus.url({
                employee: employee.id,
                deduction: deductionId,
            }),
            {},
        );
    };

    const isEffective = (deduction: EmployeeCustomDeduction) => {
        if (!deduction.is_active) return false;
        const now = new Date();
        const from = new Date(deduction.effective_from);
        const to = deduction.effective_to
            ? new Date(deduction.effective_to)
            : null;

        if (from > now) return false;
        if (to && to < now) return false;
        return true;
    };

    return (
        <>
            <Head title={`${employee.name} - Custom Deductions`} />

            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() => router.visit(`/staff/${employee.id}`)}
                    className="mb-4"
                >
                    Back to Employee
                </Button>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-dark-900 text-2xl font-bold">
                            Custom Deductions
                        </h1>
                        <p className="text-dark-600 mt-1 text-sm">
                            Manage custom deductions for {employee.name}
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        size="md"
                        startIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                            router.visit(
                                EmployeeCustomDeductionController.create.url({
                                    employee: employee.id,
                                }),
                            )
                        }
                    >
                        Add Deduction
                    </Button>
                </div>
            </div>

            {deductions.length === 0 ? (
                <EmptyState
                    icon={<DollarSign />}
                    title="No custom deductions"
                    description="This employee has no custom deductions configured yet."
                    action={
                        <Button
                            variant="primary"
                            onClick={() =>
                                router.visit(
                                    EmployeeCustomDeductionController.create.url(
                                        {
                                            employee: employee.id,
                                        },
                                    ),
                                )
                            }
                        >
                            Add First Deduction
                        </Button>
                    }
                />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-50">
                                <tr>
                                    <th scope="col" className="text-dark-600 px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Deduction Name
                                    </th>
                                    <th scope="col" className="text-dark-600 px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Type
                                    </th>
                                    <th scope="col" className="text-dark-600 px-4 py-3 text-right text-xs font-medium tracking-wider uppercase">
                                        Amount
                                    </th>
                                    <th scope="col" className="text-dark-600 px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Effective Period
                                    </th>
                                    <th scope="col" className="text-dark-600 px-4 py-3 text-center text-xs font-medium tracking-wider uppercase">
                                        Status
                                    </th>
                                    <th scope="col" className="text-dark-600 px-4 py-3 text-right text-xs font-medium tracking-wider uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-dark-200 divide-y bg-white">
                                {deductions.map((deduction) => (
                                    <tr
                                        key={deduction.id}
                                        className="hover:bg-dark-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-dark-900 font-medium">
                                                    {deduction.deduction_name}
                                                </span>
                                                {isEffective(deduction) && (
                                                    <Badge
                                                        color="success"
                                                        size="sm"
                                                        className="mt-1 w-fit"
                                                    >
                                                        Currently Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-dark-900 text-sm">
                                                {getDeductionTypeLabel(
                                                    deduction.deduction_type,
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {deduction.deduction_type ===
                                            'percentage' ? (
                                                <span className="text-dark-900 text-sm font-medium">
                                                    {deduction.percentage}%
                                                </span>
                                            ) : (
                                                <span className="text-dark-900 text-sm font-medium">
                                                    {formatCurrency(
                                                        deduction.amount,
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-dark-900 flex flex-col text-sm">
                                                <span>
                                                    From:{' '}
                                                    {formatDate(
                                                        deduction.effective_from,
                                                    )}
                                                </span>
                                                {deduction.effective_to && (
                                                    <span>
                                                        To:{' '}
                                                        {formatDate(
                                                            deduction.effective_to,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                color={
                                                    deduction.is_active
                                                        ? 'success'
                                                        : 'light'
                                                }
                                            >
                                                {deduction.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    startIcon={
                                                        deduction.is_active ? (
                                                            <ToggleRight className="h-4 w-4" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4" />
                                                        )
                                                    }
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            deduction.id,
                                                        )
                                                    }
                                                    title={
                                                        deduction.is_active
                                                            ? 'Deactivate'
                                                            : 'Activate'
                                                    }
                                                >
                                                    {deduction.is_active
                                                        ? 'Deactivate'
                                                        : 'Activate'}
                                                </Button>
                                                <Link
                                                    href={EmployeeCustomDeductionController.edit.url(
                                                        {
                                                            employee:
                                                                employee.id,
                                                            deduction:
                                                                deduction.id,
                                                        },
                                                    )}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        startIcon={
                                                            <Edit className="h-4 w-4" />
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    startIcon={
                                                        <Trash2 className="h-4 w-4" />
                                                    }
                                                    onClick={() =>
                                                        handleDelete(
                                                            deduction.id,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        deduction.id
                                                    }
                                                    loading={
                                                        deletingId ===
                                                        deduction.id
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
