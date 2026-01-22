import TimesheetController from '@/actions/App/Http/Controllers/TimesheetController.ts';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Form, Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Coffee,
    Edit,
    MapPin,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Timesheet {
    id: number;
    user_id: number;
    shop_id: number;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    break_start: string | null;
    break_end: string | null;
    break_duration_minutes: number;
    regular_hours: string;
    overtime_hours: string;
    total_hours: string;
    status: string;
    notes: string | null;
    approved_by_user_id: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    shop: Shop;
    user: User;
    approved_by: User | null;
}

interface Props {
    timesheet: Timesheet;
    canEdit: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canDelete: boolean;
}

const TimesheetShow = ({
    timesheet,
    canEdit,
    canSubmit,
    canApprove,
    canDelete,
}: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [notes, setNotes] = useState(timesheet.notes || '');
    const [rejectionReason, setRejectionReason] = useState('');

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            {
                color: 'light' | 'warning' | 'success' | 'error' | 'info';
                label: string;
            }
        > = {
            draft: { color: 'light', label: 'Draft' },
            submitted: { color: 'warning', label: 'Submitted' },
            approved: { color: 'success', label: 'Approved' },
            rejected: { color: 'error', label: 'Rejected' },
            paid: { color: 'info', label: 'Paid' },
        };

        const config = statusConfig[status] || {
            color: 'light' as const,
            label: status,
        };
        return (
            <Badge color={config.color} size="md">
                {config.label}
            </Badge>
        );
    };

    const formatDateTime = (datetime: string | null) => {
        if (!datetime) return 'Not set';
        return new Date(datetime).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (datetime: string | null) => {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this timesheet?')) {
            router.delete(
                TimesheetController.destroy.url({ timesheet: timesheet.id }),
            );
        }
    };

    return (
        <div className="h-screen">
            <Head
                title={`Timesheet - ${new Date(timesheet.date).toLocaleDateString()}`}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={TimesheetController.index.url()}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Timesheet Details
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {new Date(timesheet.date).toLocaleDateString(
                                    'en-US',
                                    {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    },
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(timesheet.status)}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="p-6">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Work Hours
                            </h2>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <Label>Clock In</Label>
                                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        <Clock className="h-5 w-5 text-green-500" />
                                        {formatTime(timesheet.clock_in)}
                                    </div>
                                </div>

                                <div>
                                    <Label>Clock Out</Label>
                                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        <Clock className="h-5 w-5 text-red-500" />
                                        {formatTime(timesheet.clock_out)}
                                    </div>
                                </div>
                            </div>

                            {timesheet.break_duration_minutes > 0 && (
                                <div className="mt-6 rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                                    <div className="flex items-center gap-2">
                                        <Coffee className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        <span className="font-medium text-orange-900 dark:text-orange-100">
                                            Break Time:{' '}
                                            {timesheet.break_duration_minutes}{' '}
                                            minutes
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Regular Hours
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {timesheet.regular_hours}h
                                    </p>
                                </div>

                                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                        Overtime Hours
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-orange-900 dark:text-orange-100">
                                        {timesheet.overtime_hours}h
                                    </p>
                                </div>

                                <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
                                    <p className="text-sm text-brand-700 dark:text-brand-300">
                                        Total Hours
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-brand-900 dark:text-brand-100">
                                        {timesheet.total_hours}h
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Notes
                                </h2>
                                {canEdit &&
                                    timesheet.status === 'draft' &&
                                    !isEditing && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    )}
                            </div>

                            {isEditing ? (
                                <Form
                                    action={TimesheetController.update.url({
                                        timesheet: timesheet.id,
                                    })}
                                    method="patch"
                                    onSuccess={() => setIsEditing(false)}
                                >
                                    {({ errors, processing }) => (
                                        <div className="space-y-4">
                                            <div>
                                                <TextArea
                                                    name="notes"
                                                    value={notes}
                                                    onChange={(value) =>
                                                        setNotes(value)
                                                    }
                                                    rows={4}
                                                    error={!!errors.notes}
                                                    hint="Add any relevant notes or comments about this timesheet"
                                                />
                                                <InputError
                                                    message={errors.notes}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Save Changes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setNotes(
                                                            timesheet.notes ||
                                                                '',
                                                        );
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Form>
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300">
                                    {timesheet.notes || 'No notes added'}
                                </p>
                            )}
                        </Card>

                        {timesheet.status === 'rejected' &&
                            timesheet.rejection_reason && (
                                <Card className="border-l-4 border-red-500 bg-red-50 p-6 dark:bg-red-900/20">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                                        <div>
                                            <h3 className="font-semibold text-red-900 dark:text-red-100">
                                                Rejection Reason
                                            </h3>
                                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                                {timesheet.rejection_reason}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Details
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Employee
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                            {timesheet.user.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Shop
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                            {timesheet.shop.name}
                                        </p>
                                    </div>
                                </div>

                                {timesheet.approved_by && (
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {timesheet.status === 'rejected'
                                                    ? 'Rejected By'
                                                    : 'Approved By'}
                                            </p>
                                            <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                                {timesheet.approved_by.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDateTime(
                                                    timesheet.approved_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Actions
                            </h2>

                            <div className="space-y-2">
                                {canSubmit && timesheet.status === 'draft' && (
                                    <Form
                                        action={TimesheetController.submit.url({
                                            timesheet: timesheet.id,
                                        })}
                                        method="post"
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                fullWidth
                                                disabled={processing}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Submit for Approval
                                            </Button>
                                        )}
                                    </Form>
                                )}

                                {canApprove && (
                                    <>
                                        <Form
                                            action={TimesheetController.approve.url(
                                                { timesheet: timesheet.id },
                                            )}
                                            method="post"
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    type="submit"
                                                    fullWidth
                                                    disabled={processing}
                                                    variant="primary"
                                                >
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Approve Timesheet
                                                </Button>
                                            )}
                                        </Form>

                                        <Button
                                            variant="destructive"
                                            fullWidth
                                            onClick={() =>
                                                setShowRejectModal(true)
                                            }
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject Timesheet
                                        </Button>
                                    </>
                                )}

                                {canDelete && (
                                    <Button
                                        variant="outline"
                                        fullWidth
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Timesheet
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="m-4 w-full max-w-md p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Reject Timesheet
                        </h3>

                        <Form
                            action={TimesheetController.reject.url({
                                timesheet: timesheet.id,
                            })}
                            method="post"
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="rejection_reason">
                                            Reason for Rejection{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <TextArea
                                            name="rejection_reason"
                                            id="rejection_reason"
                                            value={rejectionReason}
                                            onChange={(value) =>
                                                setRejectionReason(value)
                                            }
                                            rows={4}
                                            error={!!errors.rejection_reason}
                                            hint="Provide a clear reason for rejecting this timesheet"
                                        />
                                        <InputError
                                            message={errors.rejection_reason}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                            className="flex-1"
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowRejectModal(false);
                                                setRejectionReason('');
                                            }}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </Card>
                </div>
            )}
        </div>
    );
};

TimesheetShow.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default TimesheetShow;
