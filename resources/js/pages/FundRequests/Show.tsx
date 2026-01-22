import FundRequestController from '@/actions/App/Http/Controllers/FundRequestController';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/hooks/useToast';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDateShort, formatDateTime } from '@/lib/formatters';
import { getFundRequestStatusColor } from '@/lib/status-configs';
import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface FundRequest {
    id: number;
    user_id: number;
    shop_id: number;
    request_type: string;
    amount: string;
    description: string;
    status: string;
    requested_at: string;
    approved_by_user_id: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    disbursed_by_user_id: number | null;
    disbursed_at: string | null;
    receipt_uploaded: boolean;
    notes: string | null;
    shop: Shop;
    user: User;
    approved_by: User | null;
    disbursed_by: User | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    fundRequest: FundRequest;
    canUpdate: boolean;
    canApprove: boolean;
    canReject: boolean;
    canDisburse: boolean;
    canCancel: boolean;
    canDelete: boolean;
}

export default function Show({
    fundRequest,
    canUpdate,
    canApprove,
    canReject,
    canDisburse,
    canCancel,
    canDelete,
}: Props) {
    const toast = useToast();
    const { confirm, ConfirmDialogComponent } = useConfirmDialog();
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            travel: 'Travel',
            equipment: 'Equipment',
            training: 'Training',
            maintenance: 'Maintenance',
            other: 'Other',
        };
        return labels[type.toLowerCase()] || type;
    };

    const handleReject = () => {
        setShowRejectForm(true);
    };

    const handleSubmitRejection = () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        router.post(
            FundRequestController.reject.url({
                fundRequest: fundRequest.id,
            }),
            { rejection_reason: rejectionReason },
            {
                onSuccess: () => {
                    toast.success('Fund request rejected');
                    setShowRejectForm(false);
                    setRejectionReason('');
                },
                onError: () => {
                    toast.error('Failed to reject fund request');
                },
            },
        );
    };

    const handleCancel = async () => {
        const confirmed = await confirm({
            title: 'Cancel Fund Request',
            message:
                'Are you sure you want to cancel this fund request? This action cannot be undone.',
            confirmLabel: 'Cancel Request',
            variant: 'danger',
        });

        if (confirmed) {
            router.post(
                FundRequestController.cancel.url({
                    fundRequest: fundRequest.id,
                }),
                {},
                {
                    onSuccess: () => {
                        toast.success('Fund request cancelled');
                    },
                    onError: () => {
                        toast.error('Failed to cancel fund request');
                    },
                },
            );
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Fund Request',
            message:
                'Are you sure you want to delete this fund request? This action cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            router.delete(
                FundRequestController.destroy.url({
                    fundRequest: fundRequest.id,
                }),
                {
                    onSuccess: () => {
                        toast.success('Fund request deleted');
                        router.visit(FundRequestController.index.url());
                    },
                    onError: () => {
                        toast.error('Failed to delete fund request');
                    },
                },
            );
        }
    };

    return (
        <AppLayout>
            <Head title={`Fund Request #${fundRequest.id}`} />
            <ConfirmDialogComponent />

            {showRejectForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md">
                        <div className="space-y-4 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Reject Fund Request
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Please provide a reason for rejecting this fund
                                request.
                            </p>
                            <div>
                                <Label htmlFor="rejection_reason">
                                    Rejection Reason{' '}
                                    <span className="text-error-500">*</span>
                                </Label>
                                <TextArea
                                    value={rejectionReason}
                                    onChange={setRejectionReason}
                                    rows={4}
                                    placeholder="Enter reason for rejection..."
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowRejectForm(false);
                                        setRejectionReason('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleSubmitRejection}
                                >
                                    Reject Request
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={FundRequestController.index.url()}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Requests
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Fund Request #{fundRequest.id}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Requested on{' '}
                                {formatDateShort(fundRequest.requested_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {canApprove && fundRequest.status === 'pending' && (
                            <Form
                                action={FundRequestController.approve.url({
                                    fundRequest: fundRequest.id,
                                })}
                                method="post"
                                onSuccess={() => {
                                    toast.success('Fund request approved');
                                }}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        loading={processing}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                )}
                            </Form>
                        )}

                        {canReject && fundRequest.status === 'pending' && (
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                        )}

                        {canDisburse && fundRequest.status === 'approved' && (
                            <Form
                                action={FundRequestController.disburse.url({
                                    fundRequest: fundRequest.id,
                                })}
                                method="post"
                                onSuccess={() => {
                                    toast.success(
                                        'Funds disbursed successfully',
                                    );
                                }}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        loading={processing}
                                        variant="primary"
                                    >
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Disburse Funds
                                    </Button>
                                )}
                            </Form>
                        )}

                        {canCancel && fundRequest.status === 'pending' && (
                            <Button variant="outline" onClick={handleCancel}>
                                Cancel Request
                            </Button>
                        )}

                        {canDelete && (
                            <Button variant="ghost" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4 text-error-600 dark:text-error-400" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card title="Request Details">
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-950/50">
                                            <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Request Type
                                            </p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {getTypeLabel(
                                                    fundRequest.request_type,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-success-50 p-2 dark:bg-success-950/50">
                                            <DollarSign className="h-5 w-5 text-success-600 dark:text-success-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Amount
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(fundRequest.amount, 'USD')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Requested By
                                            </p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {fundRequest.user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                {fundRequest.user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                            <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Shop
                                            </p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {fundRequest.shop.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Description
                                    </h4>
                                    <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                                        {fundRequest.description}
                                    </p>
                                </div>

                                {fundRequest.notes && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Additional Notes
                                        </h4>
                                        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                                            {fundRequest.notes}
                                        </p>
                                    </div>
                                )}

                                {fundRequest.rejection_reason && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-error-700 dark:text-error-300">
                                            Rejection Reason
                                        </h4>
                                        <p className="rounded-lg bg-error-50 p-4 text-sm text-error-900 dark:bg-error-950/50 dark:text-error-200">
                                            {fundRequest.rejection_reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Status">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Current Status
                                    </span>
                                    <Badge
                                        color={getFundRequestStatusColor(
                                            fundRequest.status,
                                        )}
                                    >
                                        {fundRequest.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            fundRequest.status.slice(1)}
                                    </Badge>
                                </div>

                                <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <div className="flex items-start gap-3">
                                        <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Requested
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatDateTime(fundRequest.requested_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {fundRequest.approved_at && (
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="mt-0.5 h-4 w-4 text-success-500" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    Approved by{' '}
                                                    {fundRequest.approved_by
                                                        ?.name || 'N/A'}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatDateTime(fundRequest.approved_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {fundRequest.disbursed_at && (
                                        <div className="flex items-start gap-3">
                                            <DollarSign className="text-info-500 mt-0.5 h-4 w-4" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    Disbursed by{' '}
                                                    {fundRequest.disbursed_by
                                                        ?.name || 'N/A'}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatDateTime(fundRequest.disbursed_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card title="Receipt">
                            <div className="text-center">
                                {fundRequest.receipt_uploaded ? (
                                    <div className="rounded-lg bg-success-50 p-4 dark:bg-success-950/50">
                                        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success-600 dark:text-success-400" />
                                        <p className="text-sm font-medium text-success-900 dark:text-success-200">
                                            Receipt Uploaded
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                        <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            No receipt uploaded yet
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

Show.layout = (page: React.ReactNode) => page;
