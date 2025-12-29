import WageAdvanceController from '@/actions/App/Http/Controllers/WageAdvanceController';
import InputError from '@/components/form/InputError';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import TextArea from '@/components/form/input/TextArea';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle,
    CreditCard,
    DollarSign,
    TrendingUp,
    User,
    XCircle,
    AlertCircle,
    Clock,
    Trash2,
} from 'lucide-react';
import { FormEvent } from 'react';

type BadgeColor =
    | 'primary'
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';

interface Shop {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface WageAdvance {
    id: number;
    user_id: number;
    shop_id: number;
    amount_requested: string;
    amount_approved: string | null;
    repayment_installments: number;
    amount_repaid: string;
    status: string;
    reason: string | null;
    requested_at: string;
    approved_at: string | null;
    rejected_at: string | null;
    disbursed_at: string | null;
    cancelled_at: string | null;
    repayment_start_date: string | null;
    repayment_end_date: string | null;
    approval_notes: string | null;
    rejection_reason: string | null;
    shop: Shop;
    user: User;
    approved_by: User | null;
    disbursed_by: User | null;
}

interface Props {
    wageAdvance: WageAdvance;
    remainingBalance: number;
    installmentAmount: number;
    canUpdate: boolean;
    canApprove: boolean;
    canReject: boolean;
    canDisburse: boolean;
    canRecordRepayment: boolean;
    canCancel: boolean;
    canDelete: boolean;
}

export default function Show({
    wageAdvance,
    remainingBalance,
    installmentAmount,
    canUpdate,
    canApprove,
    canReject,
    canDisburse,
    canRecordRepayment,
    canCancel,
    canDelete,
}: Props) {
    const approveModal = useModal();
    const rejectModal = useModal();
    const disburseModal = useModal();
    const repaymentModal = useModal();
    const cancelModal = useModal();
    const deleteModal = useModal();

    // Approve form
    const approveForm = useForm({
        amount_approved: wageAdvance.amount_requested,
        approval_notes: '',
    });

    // Reject form
    const rejectForm = useForm({
        rejection_reason: '',
    });

    // Disburse form
    const disburseForm = useForm({
        disbursement_method: 'bank_transfer',
        disbursement_reference: '',
        disbursement_notes: '',
    });

    // Repayment form
    const repaymentForm = useForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Cancel form
    const cancelForm = useForm({
        cancellation_reason: '',
    });

    const getStatusColor = (status: string): BadgeColor => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'disbursed':
                return 'info';
            case 'repaying':
                return 'primary';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'light';
            default:
                return 'light';
        }
    };

    const handleApprove = (e: FormEvent) => {
        e.preventDefault();
        approveForm.post(
            WageAdvanceController.approve.url({
                wageAdvance: wageAdvance.id,
            }),
            {
                onSuccess: () => {
                    approveModal.closeModal();
                },
            }
        );
    };

    const handleReject = (e: FormEvent) => {
        e.preventDefault();
        rejectForm.post(
            WageAdvanceController.reject.url({
                wageAdvance: wageAdvance.id,
            }),
            {
                onSuccess: () => {
                    rejectModal.closeModal();
                },
            }
        );
    };

    const handleDisburse = (e: FormEvent) => {
        e.preventDefault();
        disburseForm.post(
            WageAdvanceController.disburse.url({
                wageAdvance: wageAdvance.id,
            }),
            {
                onSuccess: () => {
                    disburseModal.closeModal();
                },
            }
        );
    };

    const handleRecordRepayment = (e: FormEvent) => {
        e.preventDefault();
        repaymentForm.post(
            WageAdvanceController.recordRepayment.url({
                wageAdvance: wageAdvance.id,
            }),
            {
                onSuccess: () => {
                    repaymentModal.closeModal();
                },
            }
        );
    };

    const handleCancel = (e: FormEvent) => {
        e.preventDefault();
        cancelForm.post(
            WageAdvanceController.cancel.url({
                wageAdvance: wageAdvance.id,
            }),
            {
                onSuccess: () => {
                    cancelModal.closeModal();
                },
            }
        );
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this wage advance?')) {
            deleteModal.closeModal();
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatShortDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: string | number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(parseFloat(amount.toString()));
    };

    const approvedAmount =
        wageAdvance.amount_approved || wageAdvance.amount_requested;
    const repaymentProgress =
        (parseFloat(wageAdvance.amount_repaid) / parseFloat(approvedAmount)) *
        100;

    return (
        <>
            <Head title={`Wage Advance #${wageAdvance.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={WageAdvanceController.index.url()}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Wage Advances
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Wage Advance #{wageAdvance.id}
                            </h1>
                            <Badge
                                variant="light"
                                color={getStatusColor(wageAdvance.status)}
                            >
                                {wageAdvance.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {canApprove && wageAdvance.status === 'pending' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={approveModal.openModal}
                                startIcon={<CheckCircle className="h-4 w-4" />}
                            >
                                Approve
                            </Button>
                        )}
                        {canReject && wageAdvance.status === 'pending' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={rejectModal.openModal}
                                startIcon={<XCircle className="h-4 w-4" />}
                            >
                                Reject
                            </Button>
                        )}
                        {canDisburse && wageAdvance.status === 'approved' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={disburseModal.openModal}
                                startIcon={<CreditCard className="h-4 w-4" />}
                            >
                                Disburse
                            </Button>
                        )}
                        {canRecordRepayment &&
                            (wageAdvance.status === 'disbursed' ||
                                wageAdvance.status === 'repaying') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={repaymentModal.openModal}
                                    startIcon={
                                        <TrendingUp className="h-4 w-4" />
                                    }
                                >
                                    Record Repayment
                                </Button>
                            )}
                        {canCancel &&
                            wageAdvance.status !== 'cancelled' &&
                            wageAdvance.status !== 'completed' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelModal.openModal}
                                    startIcon={<XCircle className="h-4 w-4" />}
                                >
                                    Cancel
                                </Button>
                            )}
                        {canDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={deleteModal.openModal}
                                startIcon={<Trash2 className="h-4 w-4" />}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Approved Amount
                                </p>
                                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(approvedAmount)}
                                </p>
                                {wageAdvance.amount_approved &&
                                    wageAdvance.amount_approved !==
                                        wageAdvance.amount_requested && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Requested:{' '}
                                            {formatCurrency(
                                                wageAdvance.amount_requested
                                            )}
                                        </p>
                                    )}
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Amount Repaid
                                </p>
                                <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(wageAdvance.amount_repaid)}
                                </p>
                                <div className="mt-2">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-full bg-green-600 transition-all dark:bg-green-400"
                                            style={{
                                                width: `${Math.min(repaymentProgress, 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {repaymentProgress.toFixed(1)}% repaid
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Remaining Balance
                                </p>
                                <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {formatCurrency(remainingBalance)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formatCurrency(installmentAmount)} / month
                                </p>
                            </div>
                            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Details Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Employee & Shop Information */}
                    <Card className="p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Employee Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="mt-1 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Employee
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {wageAdvance.user.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {wageAdvance.user.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building2 className="mt-1 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Shop
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {wageAdvance.shop.name}
                                    </p>
                                </div>
                            </div>

                            {wageAdvance.reason && (
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Reason
                                        </p>
                                        <p className="text-gray-900 dark:text-white">
                                            {wageAdvance.reason}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Repayment Information */}
                    <Card className="p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Repayment Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Installments
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {wageAdvance.repayment_installments} months
                                </p>
                            </div>

                            <div className="flex justify-between">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Monthly Deduction
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(installmentAmount)}
                                </p>
                            </div>

                            <div className="flex justify-between">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Repayment Start
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatShortDate(
                                        wageAdvance.repayment_start_date
                                    )}
                                </p>
                            </div>

                            <div className="flex justify-between">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Repayment End
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatShortDate(
                                        wageAdvance.repayment_end_date
                                    )}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Status Timeline */}
                    <Card className="p-6 lg:col-span-2">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Status Timeline
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Clock className="mt-1 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Requested
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(wageAdvance.requested_at)}
                                    </p>
                                </div>
                            </div>

                            {wageAdvance.approved_at && (
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Approved
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(wageAdvance.approved_at)}
                                        </p>
                                        {wageAdvance.approved_by && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                by {wageAdvance.approved_by.name}
                                            </p>
                                        )}
                                        {wageAdvance.approval_notes && (
                                            <p className="mt-1 text-sm italic text-gray-600 dark:text-gray-400">
                                                "{wageAdvance.approval_notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {wageAdvance.rejected_at && (
                                <div className="flex items-start gap-3">
                                    <XCircle className="mt-1 h-5 w-5 text-red-600 dark:text-red-400" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Rejected
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(wageAdvance.rejected_at)}
                                        </p>
                                        {wageAdvance.rejection_reason && (
                                            <p className="mt-1 text-sm italic text-red-600 dark:text-red-400">
                                                "{wageAdvance.rejection_reason}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {wageAdvance.disbursed_at && (
                                <div className="flex items-start gap-3">
                                    <CreditCard className="mt-1 h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Disbursed
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(wageAdvance.disbursed_at)}
                                        </p>
                                        {wageAdvance.disbursed_by && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                by {wageAdvance.disbursed_by.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {wageAdvance.cancelled_at && (
                                <div className="flex items-start gap-3">
                                    <XCircle className="mt-1 h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Cancelled
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(wageAdvance.cancelled_at)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Approve Modal */}
            <Modal
                isOpen={approveModal.isOpen}
                onClose={approveModal.closeModal}
                title="Approve Wage Advance"
            >
                <form onSubmit={handleApprove} className="space-y-4">
                    <div>
                        <Label htmlFor="amount_approved">
                            Approved Amount{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            id="amount_approved"
                            name="amount_approved"
                            value={approveForm.data.amount_approved}
                            onChange={(e) =>
                                approveForm.setData(
                                    'amount_approved',
                                    e.target.value
                                )
                            }
                            step="0.01"
                            min="0.01"
                            error={!!approveForm.errors.amount_approved}
                            required
                        />
                        <InputError
                            message={approveForm.errors.amount_approved}
                        />
                    </div>

                    <div>
                        <Label htmlFor="approval_notes">
                            Approval Notes (Optional)
                        </Label>
                        <TextArea
                            id="approval_notes"
                            name="approval_notes"
                            value={approveForm.data.approval_notes}
                            onChange={(value) =>
                                approveForm.setData('approval_notes', value)
                            }
                            rows={3}
                            error={!!approveForm.errors.approval_notes}
                        />
                        <InputError
                            message={approveForm.errors.approval_notes}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={approveForm.processing}
                            loading={approveForm.processing}
                            className="flex-1"
                        >
                            Approve
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={approveModal.closeModal}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={rejectModal.isOpen}
                onClose={rejectModal.closeModal}
                title="Reject Wage Advance"
            >
                <form onSubmit={handleReject} className="space-y-4">
                    <div>
                        <Label htmlFor="rejection_reason">
                            Rejection Reason{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <TextArea
                            id="rejection_reason"
                            name="rejection_reason"
                            value={rejectForm.data.rejection_reason}
                            onChange={(value) =>
                                rejectForm.setData('rejection_reason', value)
                            }
                            rows={3}
                            error={!!rejectForm.errors.rejection_reason}
                            required
                        />
                        <InputError
                            message={rejectForm.errors.rejection_reason}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={rejectForm.processing}
                            loading={rejectForm.processing}
                            className="flex-1"
                        >
                            Reject
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={rejectModal.closeModal}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Disburse Modal */}
            <Modal
                isOpen={disburseModal.isOpen}
                onClose={disburseModal.closeModal}
                title="Disburse Wage Advance"
            >
                <form onSubmit={handleDisburse} className="space-y-4">
                    <div>
                        <Label htmlFor="disbursement_method">
                            Disbursement Method{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <select
                            id="disbursement_method"
                            name="disbursement_method"
                            value={disburseForm.data.disbursement_method}
                            onChange={(e) =>
                                disburseForm.setData(
                                    'disbursement_method',
                                    e.target.value
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            required
                        >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="mobile_money">Mobile Money</option>
                        </select>
                        <InputError
                            message={disburseForm.errors.disbursement_method}
                        />
                    </div>

                    <div>
                        <Label htmlFor="disbursement_reference">
                            Reference Number
                        </Label>
                        <Input
                            type="text"
                            id="disbursement_reference"
                            name="disbursement_reference"
                            value={disburseForm.data.disbursement_reference}
                            onChange={(e) =>
                                disburseForm.setData(
                                    'disbursement_reference',
                                    e.target.value
                                )
                            }
                            error={
                                !!disburseForm.errors.disbursement_reference
                            }
                        />
                        <InputError
                            message={
                                disburseForm.errors.disbursement_reference
                            }
                        />
                    </div>

                    <div>
                        <Label htmlFor="disbursement_notes">Notes</Label>
                        <TextArea
                            id="disbursement_notes"
                            name="disbursement_notes"
                            value={disburseForm.data.disbursement_notes}
                            onChange={(value) =>
                                disburseForm.setData(
                                    'disbursement_notes',
                                    value
                                )
                            }
                            rows={3}
                            error={!!disburseForm.errors.disbursement_notes}
                        />
                        <InputError
                            message={disburseForm.errors.disbursement_notes}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={disburseForm.processing}
                            loading={disburseForm.processing}
                            className="flex-1"
                        >
                            Disburse
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={disburseModal.closeModal}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Repayment Modal */}
            <Modal
                isOpen={repaymentModal.isOpen}
                onClose={repaymentModal.closeModal}
                title="Record Repayment"
            >
                <form onSubmit={handleRecordRepayment} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">
                            Amount <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            id="amount"
                            name="amount"
                            value={repaymentForm.data.amount}
                            onChange={(e) =>
                                repaymentForm.setData('amount', e.target.value)
                            }
                            step="0.01"
                            min="0.01"
                            max={remainingBalance.toString()}
                            error={!!repaymentForm.errors.amount}
                            required
                        />
                        <InputError message={repaymentForm.errors.amount} />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Remaining: {formatCurrency(remainingBalance)}
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="payment_date">
                            Payment Date{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="date"
                            id="payment_date"
                            name="payment_date"
                            value={repaymentForm.data.payment_date}
                            onChange={(e) =>
                                repaymentForm.setData(
                                    'payment_date',
                                    e.target.value
                                )
                            }
                            error={!!repaymentForm.errors.payment_date}
                            required
                        />
                        <InputError
                            message={repaymentForm.errors.payment_date}
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <TextArea
                            id="notes"
                            name="notes"
                            value={repaymentForm.data.notes}
                            onChange={(value) =>
                                repaymentForm.setData('notes', value)
                            }
                            rows={3}
                            error={!!repaymentForm.errors.notes}
                        />
                        <InputError message={repaymentForm.errors.notes} />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={repaymentForm.processing}
                            loading={repaymentForm.processing}
                            className="flex-1"
                        >
                            Record Payment
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={repaymentModal.closeModal}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Cancel Modal */}
            <Modal
                isOpen={cancelModal.isOpen}
                onClose={cancelModal.closeModal}
                title="Cancel Wage Advance"
            >
                <form onSubmit={handleCancel} className="space-y-4">
                    <div>
                        <Label htmlFor="cancellation_reason">
                            Cancellation Reason{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <TextArea
                            id="cancellation_reason"
                            name="cancellation_reason"
                            value={cancelForm.data.cancellation_reason}
                            onChange={(value) =>
                                cancelForm.setData(
                                    'cancellation_reason',
                                    value
                                )
                            }
                            rows={3}
                            error={!!cancelForm.errors.cancellation_reason}
                            required
                        />
                        <InputError
                            message={cancelForm.errors.cancellation_reason}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={cancelForm.processing}
                            loading={cancelForm.processing}
                            className="flex-1"
                        >
                            Cancel Advance
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={cancelModal.closeModal}
                        >
                            Close
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

Show.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
