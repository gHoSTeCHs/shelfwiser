import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import PayrollSettingsController from '@/actions/App/Http/Controllers/PayrollSettingsController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import type { EnumOption, PayCalendar } from '@/types/payroll';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Pencil,
    Plus,
    Star,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    payCalendars: PayCalendar[];
    frequencies: EnumOption[];
}

export default function PayCalendars({ payCalendars, frequencies }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingCalendar, setEditingCalendar] = useState<PayCalendar | null>(
        null,
    );
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const form = useForm({
        name: '',
        description: '',
        frequency: 'monthly',
        pay_day: '28',
        cutoff_day: '',
        is_default: false,
        is_active: true,
    });

    const openCreateModal = () => {
        form.reset();
        setEditingCalendar(null);
        setShowModal(true);
    };

    const openEditModal = (calendar: PayCalendar) => {
        setEditingCalendar(calendar);
        form.setData({
            name: calendar.name,
            description: calendar.description || '',
            frequency: calendar.frequency,
            pay_day: calendar.pay_day.toString(),
            cutoff_day:
                calendar.cutoff_day !== undefined &&
                calendar.cutoff_day !== null
                    ? calendar.cutoff_day.toString()
                    : '',
            is_default: calendar.is_default,
            is_active: calendar.is_active,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCalendar(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCalendar) {
            form.put(
                PayrollSettingsController.updatePayCalendar.url({
                    payCalendar: editingCalendar.id,
                }),
                {
                    onSuccess: () => closeModal(),
                },
            );
        } else {
            form.post(PayrollSettingsController.storePayCalendar.url(), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(
            PayrollSettingsController.destroyPayCalendar.url({
                payCalendar: id,
            }),
            {
                onSuccess: () => setDeleteConfirm(null),
            },
        );
    };

    const getFrequencyLabel = (frequency: string) => {
        const labels: Record<string, string> = {
            daily: 'Daily',
            weekly: 'Weekly',
            bi_weekly: 'Bi-Weekly',
            semi_monthly: 'Semi-Monthly',
            monthly: 'Monthly',
        };
        return labels[frequency] || frequency;
    };

    const getFrequencyColor = (frequency: string) => {
        switch (frequency) {
            case 'daily':
                return 'error';
            case 'weekly':
                return 'warning';
            case 'bi_weekly':
                return 'info';
            case 'semi_monthly':
                return 'primary';
            case 'monthly':
                return 'success';
            default:
                return 'light';
        }
    };

    const getPayDayLabel = (payDay: number, frequency: string) => {
        if (frequency === 'weekly' || frequency === 'bi_weekly') {
            const days = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ];
            return days[payDay] || `Day ${payDay}`;
        }
        if (payDay === 32) return 'Last day of month';
        const suffix = ['th', 'st', 'nd', 'rd'];
        const v = payDay % 100;
        return payDay + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
    };

    const payDayOptions = () => {
        if (
            form.data.frequency === 'weekly' ||
            form.data.frequency === 'bi_weekly'
        ) {
            return [
                { value: '0', label: 'Sunday' },
                { value: '1', label: 'Monday' },
                { value: '2', label: 'Tuesday' },
                { value: '3', label: 'Wednesday' },
                { value: '4', label: 'Thursday' },
                { value: '5', label: 'Friday' },
                { value: '6', label: 'Saturday' },
            ];
        }

        const options = [];
        for (let i = 1; i <= 31; i++) {
            const suffix = ['th', 'st', 'nd', 'rd'];
            const v = i % 100;
            options.push({
                value: i.toString(),
                label: i + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]),
            });
        }
        options.push({ value: '32', label: 'Last day of month' });
        return options;
    };

    return (
        <>
            <Head title="Pay Calendars" />

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
                        Pay Calendars
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure payment schedules for different employee
                        groups
                    </p>
                </div>

                <Button
                    variant="primary"
                    startIcon={<Plus className="h-4 w-4" />}
                    onClick={openCreateModal}
                >
                    Add Pay Calendar
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {payCalendars.map((calendar) => (
                    <Card key={calendar.id} className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900/20">
                                    <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {calendar.name}
                                        </h3>
                                        {calendar.is_default && (
                                            <Star className="h-4 w-4 fill-warning-400 text-warning-400" />
                                        )}
                                    </div>
                                    <Badge
                                        color={getFrequencyColor(
                                            calendar.frequency,
                                        )}
                                        size="sm"
                                    >
                                        {getFrequencyLabel(calendar.frequency)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(calendar)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                {!calendar.is_default &&
                                    (deleteConfirm === calendar.id ? (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(calendar.id)
                                                }
                                            >
                                                Yes
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteConfirm(null)
                                                }
                                            >
                                                No
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteConfirm(calendar.id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4 text-error-500" />
                                        </Button>
                                    ))}
                            </div>
                        </div>

                        {calendar.description && (
                            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                                {calendar.description}
                            </p>
                        )}

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Pay Day
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {getPayDayLabel(
                                        calendar.pay_day,
                                        calendar.frequency,
                                    )}
                                </span>
                            </div>
                            {calendar.cutoff_day && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Cutoff Day
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {getPayDayLabel(
                                            calendar.cutoff_day,
                                            calendar.frequency,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Employees
                                </span>
                                <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                                    <Users className="h-4 w-4" />
                                    {calendar.employees_count || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Status
                                </span>
                                {calendar.is_active ? (
                                    <Badge color="success" size="sm">
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge color="light" size="sm">
                                        Inactive
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {payCalendars.length === 0 && (
                    <Card className="col-span-full p-8 text-center">
                        <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                            No Pay Calendars
                        </h3>
                        <p className="mb-4 text-gray-500 dark:text-gray-400">
                            Create a pay calendar to define payment schedules
                            for your employees.
                        </p>
                        <Button variant="primary" onClick={openCreateModal}>
                            Create Pay Calendar
                        </Button>
                    </Card>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="m-4 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingCalendar
                                    ? 'Edit Pay Calendar'
                                    : 'Add Pay Calendar'}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeModal}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">
                                    Name{' '}
                                    <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="Monthly Payroll"
                                    error={!!form.errors.name}
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <TextArea
                                    name="description"
                                    value={form.data.description}
                                    onChange={(value) =>
                                        form.setData('description', value)
                                    }
                                    placeholder="Optional description"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <Label htmlFor="frequency">
                                    Pay Frequency{' '}
                                    <span className="text-error-500">*</span>
                                </Label>
                                <Select
                                    options={frequencies.map((f) => ({
                                        value: f.value,
                                        label: f.label,
                                    }))}
                                    defaultValue={form.data.frequency}
                                    onChange={(value) => {
                                        form.setData('frequency', value);
                                        if (
                                            value === 'weekly' ||
                                            value === 'bi_weekly'
                                        ) {
                                            form.setData('pay_day', '5');
                                        } else {
                                            form.setData('pay_day', '28');
                                        }
                                    }}
                                />
                                <InputError message={form.errors.frequency} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="pay_day">
                                        Pay Day{' '}
                                        <span className="text-error-500">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        options={payDayOptions()}
                                        defaultValue={form.data.pay_day}
                                        onChange={(value) =>
                                            form.setData('pay_day', value)
                                        }
                                    />
                                    <InputError message={form.errors.pay_day} />
                                </div>

                                <div>
                                    <Label htmlFor="cutoff_day">
                                        Cutoff Day (Optional)
                                    </Label>
                                    <Select
                                        options={[
                                            { value: '', label: 'No cutoff' },
                                            ...payDayOptions(),
                                        ]}
                                        defaultValue={form.data.cutoff_day}
                                        onChange={(value) =>
                                            form.setData('cutoff_day', value)
                                        }
                                    />
                                    <InputError
                                        message={form.errors.cutoff_day}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Last day to submit timesheets/changes
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="is_default"
                                        checked={form.data.is_default}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_default',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="is_default"
                                        className="mb-0"
                                    >
                                        Set as default calendar for new
                                        employees
                                    </Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="is_active"
                                        checked={form.data.is_active}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <Label htmlFor="is_active" className="mb-0">
                                        Active
                                    </Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={form.processing}
                                    loading={form.processing}
                                >
                                    {editingCalendar ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </>
    );
}

PayCalendars.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
