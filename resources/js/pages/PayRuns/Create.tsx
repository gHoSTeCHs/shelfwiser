import { Head, router } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import PayRunController from '@/actions/App/Http/Controllers/PayRunController';
import { ArrowLeft, Users, Calendar } from 'lucide-react';
import type { PayrollPeriod, PayCalendar } from '@/types/payroll';

interface Props {
    periods: PayrollPeriod[];
    payCalendars: PayCalendar[];
    eligibleEmployeesCount: number;
}

export default function Create({ periods, payCalendars, eligibleEmployeesCount }: Props) {
    const [selectedPeriodId, setSelectedPeriodId] = useState('');
    const [selectedCalendarId, setSelectedCalendarId] = useState('');
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');

    const selectedPeriod = periods.find((p) => p.id.toString() === selectedPeriodId);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <>
            <Head title="Create Pay Run" />

            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() => router.visit(PayRunController.index.url())}
                >
                    Back to Pay Runs
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Pay Run</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Start a new payroll processing run for a pay period
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <Form
                            action={PayRunController.store.url()}
                            method="post"
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="payroll_period_id">
                                            Payroll Period <span className="text-error-500">*</span>
                                        </Label>
                                        <Select
                                            options={[
                                                { value: '', label: 'Select a payroll period' },
                                                ...periods.map((period) => ({
                                                    value: period.id.toString(),
                                                    label: `${period.period_name} (${formatDate(period.start_date)} - ${formatDate(period.end_date)})`,
                                                })),
                                            ]}
                                            defaultValue={selectedPeriodId}
                                            onChange={(value) => setSelectedPeriodId(value)}
                                        />
                                        <input type="hidden" name="payroll_period_id" value={selectedPeriodId} />
                                        <InputError message={errors.payroll_period_id} />
                                        {periods.length === 0 && (
                                            <p className="mt-1 text-sm text-warning-600">
                                                No open payroll periods available. Create a payroll period first.
                                            </p>
                                        )}
                                    </div>

                                    {payCalendars.length > 0 && (
                                        <div>
                                            <Label htmlFor="pay_calendar_id">Pay Calendar (Optional)</Label>
                                            <Select
                                                options={[
                                                    { value: '', label: 'All employees' },
                                                    ...payCalendars.map((cal) => ({
                                                        value: cal.id.toString(),
                                                        label: `${cal.name} (${cal.frequency})`,
                                                    })),
                                                ]}
                                                defaultValue={selectedCalendarId}
                                                onChange={(value) => setSelectedCalendarId(value)}
                                            />
                                            <input type="hidden" name="pay_calendar_id" value={selectedCalendarId} />
                                            <InputError message={errors.pay_calendar_id} />
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Filter employees by pay calendar schedule
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="name">Pay Run Name (Optional)</Label>
                                        <Input
                                            type="text"
                                            name="name"
                                            placeholder="e.g., December 2024 Salary"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            error={!!errors.name}
                                        />
                                        <InputError message={errors.name} />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Leave blank to auto-generate based on period
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="notes">Notes (Optional)</Label>
                                        <TextArea
                                            name="notes"
                                            placeholder="Any additional notes for this pay run..."
                                            rows={3}
                                            value={notes}
                                            onChange={(value) => setNotes(value)}
                                            error={!!errors.notes}
                                        />
                                        <InputError message={errors.notes} />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.visit(PayRunController.index.url())}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={processing || !selectedPeriodId}
                                            loading={processing}
                                        >
                                            Create Pay Run
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Eligible Employees
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                                <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {eligibleEmployeesCount}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Employees with active payroll
                                </p>
                            </div>
                        </div>
                    </Card>

                    {selectedPeriod && (
                        <Card className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Selected Period
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedPeriod.period_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Start Date</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(selectedPeriod.start_date)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">End Date</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(selectedPeriod.end_date)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Payment Date</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(selectedPeriod.payment_date)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card className="p-6">
                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                            Pay Run Workflow
                        </h3>
                        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    1
                                </span>
                                <span>Create pay run (Draft)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    2
                                </span>
                                <span>Calculate employee pay</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    3
                                </span>
                                <span>Review and submit for approval</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    4
                                </span>
                                <span>Approve pay run</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    5
                                </span>
                                <span>Complete and generate payslips</span>
                            </li>
                        </ol>
                    </Card>
                </div>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
