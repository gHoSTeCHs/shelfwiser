import { Head, Link, Form, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import {
    Calendar,
    DollarSign,
    Users,
    CheckCircle,
    XCircle,
    Play,
    ArrowLeft,
    Trash2,
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Shop {
    id: number;
    name: string;
}

interface Payslip {
    id: number;
    user_id: number;
    gross_pay: string;
    total_deductions: string;
    net_pay: string;
    base_salary: string;
    regular_hours: string;
    regular_pay: string;
    overtime_hours: string;
    overtime_pay: string;
    income_tax: string;
    pension_employee: string;
    pension_employer: string;
    nhf: string;
    nhis: string;
    wage_advance_deduction: string;
    user: User;
}

interface PayrollPeriod {
    id: number;
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
    status: string;
    total_gross_pay: string;
    total_deductions: string;
    total_net_pay: string;
    employee_count: number;
    includes_general_manager: boolean;
    requires_owner_approval: boolean;
    processed_at: string | null;
    approved_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    shop?: Shop;
    processed_by?: User;
    approved_by?: User;
    payslips: Payslip[];
}

interface Props {
    payrollPeriod: PayrollPeriod;
    canProcess: boolean;
    canApprove: boolean;
    canMarkAsPaid: boolean;
    canCancel: boolean;
    canDelete: boolean;
}

export default function Show({
    payrollPeriod,
    canProcess,
    canApprove,
    canMarkAsPaid,
    canCancel,
    canDelete,
}: Props) {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [approving, setApproving] = useState(false);
    const [markingPaid, setMarkingPaid] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'light';
            case 'processing':
                return 'warning';
            case 'processed':
                return 'info';
            case 'approved':
                return 'success';
            case 'paid':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'light';
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(parseFloat(amount.toString()));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleProcess = () => {
        if (
            confirm(
                'Are you sure you want to process this payroll? This will generate payslips for all eligible employees.'
            )
        ) {
            setProcessing(true);
            router.post(
                PayrollController.process.url({ payrollPeriod: payrollPeriod.id }),
                {},
                {
                    onFinish: () => setProcessing(false),
                }
            );
        }
    };

    const handleApprove = () => {
        if (confirm('Are you sure you want to approve this payroll?')) {
            setApproving(true);
            router.post(
                PayrollController.approve.url({ payrollPeriod: payrollPeriod.id }),
                {},
                {
                    onFinish: () => setApproving(false),
                }
            );
        }
    };

    const handleMarkAsPaid = () => {
        if (
            confirm(
                'Are you sure you want to mark this payroll as paid? This will trigger wage advance repayments.'
            )
        ) {
            setMarkingPaid(true);
            router.post(
                PayrollController.markAsPaid.url({ payrollPeriod: payrollPeriod.id }),
                {},
                {
                    onFinish: () => setMarkingPaid(false),
                }
            );
        }
    };

    const handleCancel = () => {
        if (!cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        setCancelling(true);
        router.post(
            PayrollController.cancel.url({ payrollPeriod: payrollPeriod.id }),
            { reason: cancelReason },
            {
                onSuccess: () => {
                    setShowCancelDialog(false);
                    setCancelReason('');
                },
                onFinish: () => setCancelling(false),
            }
        );
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(PayrollController.destroy.url({ payrollPeriod: payrollPeriod.id }), {
            onSuccess: () => {
                router.visit(PayrollController.index.url());
            },
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AppLayout>
            <Head title={`Payroll - ${payrollPeriod.period_name}`} />

            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() => router.visit(PayrollController.index.url())}
                    className="mb-4"
                >
                    Back to Payroll
                </Button>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-dark-900">
                                {payrollPeriod.period_name}
                            </h1>
                            <Badge color={getStatusColor(payrollPeriod.status)}>
                                {payrollPeriod.status}
                            </Badge>
                            {payrollPeriod.requires_owner_approval && (
                                <Badge color="warning" size="sm">
                                    Needs Owner Approval
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-dark-600">
                            {payrollPeriod.shop ? payrollPeriod.shop.name : 'All Shops'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {canProcess && payrollPeriod.status === 'draft' && (
                            <Button
                                variant="primary"
                                size="md"
                                startIcon={<Play className="h-4 w-4" />}
                                onClick={handleProcess}
                                loading={processing}
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : 'Process Payroll'}
                            </Button>
                        )}

                        {canApprove && payrollPeriod.status === 'processed' && (
                            <Button
                                variant="primary"
                                size="md"
                                startIcon={<CheckCircle className="h-4 w-4" />}
                                onClick={handleApprove}
                                loading={approving}
                                disabled={approving}
                            >
                                {approving ? 'Approving...' : 'Approve Payroll'}
                            </Button>
                        )}

                        {canMarkAsPaid && payrollPeriod.status === 'approved' && (
                            <Button
                                variant="primary"
                                size="md"
                                startIcon={<DollarSign className="h-4 w-4" />}
                                onClick={handleMarkAsPaid}
                                loading={markingPaid}
                                disabled={markingPaid}
                            >
                                {markingPaid ? 'Marking as Paid...' : 'Mark as Paid'}
                            </Button>
                        )}

                        {canCancel && (
                            <Button
                                variant="outline"
                                size="md"
                                startIcon={<XCircle className="h-4 w-4" />}
                                onClick={() => setShowCancelDialog(true)}
                                disabled={cancelling}
                            >
                                Cancel
                            </Button>
                        )}

                        {canDelete && payrollPeriod.status === 'draft' && (
                            <Button
                                variant="destructive"
                                size="md"
                                startIcon={<Trash2 className="h-4 w-4" />}
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={deleting}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {payrollPeriod.cancelled_at && (
                <Card className="mb-6 border-error-200 bg-error-50 p-4">
                    <div className="flex items-start gap-3">
                        <XCircle className="mt-0.5 h-5 w-5 text-error-600" />
                        <div>
                            <h3 className="font-semibold text-error-900">Payroll Cancelled</h3>
                            <p className="mt-1 text-sm text-error-700">
                                Cancelled on {formatDateTime(payrollPeriod.cancelled_at)}
                            </p>
                            {payrollPeriod.cancellation_reason && (
                                <p className="mt-2 text-sm text-error-700">
                                    Reason: {payrollPeriod.cancellation_reason}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Period</p>
                            <p className="mt-1 text-sm text-dark-900">
                                {formatDate(payrollPeriod.start_date)} -{' '}
                                {formatDate(payrollPeriod.end_date)}
                            </p>
                        </div>
                        <Calendar className="h-5 w-5 text-dark-400" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Payment Date</p>
                            <p className="mt-1 text-sm text-dark-900">
                                {formatDate(payrollPeriod.payment_date)}
                            </p>
                        </div>
                        <Calendar className="h-5 w-5 text-dark-400" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Employees</p>
                            <p className="mt-1 text-lg font-bold text-dark-900">
                                {payrollPeriod.employee_count}
                            </p>
                        </div>
                        <Users className="h-5 w-5 text-dark-400" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Total Net Pay</p>
                            <p className="mt-1 text-lg font-bold text-success-600">
                                {formatCurrency(payrollPeriod.total_net_pay)}
                            </p>
                        </div>
                        <DollarSign className="h-5 w-5 text-success-600" />
                    </div>
                </Card>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                <Card className="p-4">
                    <h3 className="mb-3 font-semibold text-dark-900">Gross Pay</h3>
                    <p className="text-2xl font-bold text-dark-900">
                        {formatCurrency(payrollPeriod.total_gross_pay)}
                    </p>
                </Card>

                <Card className="p-4">
                    <h3 className="mb-3 font-semibold text-dark-900">Total Deductions</h3>
                    <p className="text-2xl font-bold text-warning-600">
                        {formatCurrency(payrollPeriod.total_deductions)}
                    </p>
                </Card>

                <Card className="p-4">
                    <h3 className="mb-3 font-semibold text-dark-900">Net Pay</h3>
                    <p className="text-2xl font-bold text-success-600">
                        {formatCurrency(payrollPeriod.total_net_pay)}
                    </p>
                </Card>
            </div>

            {payrollPeriod.processed_at && (
                <Card className="mb-6 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Processed By</p>
                            <p className="mt-1 text-sm text-dark-900">
                                {payrollPeriod.processed_by?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-dark-500">
                                {formatDateTime(payrollPeriod.processed_at)}
                            </p>
                        </div>

                        {payrollPeriod.approved_at && (
                            <div>
                                <p className="text-sm font-medium text-dark-600">Approved By</p>
                                <p className="mt-1 text-sm text-dark-900">
                                    {payrollPeriod.approved_by?.name || 'N/A'}
                                </p>
                                <p className="text-xs text-dark-500">
                                    {formatDateTime(payrollPeriod.approved_at)}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Card className="overflow-hidden">
                <div className="border-b border-dark-200 bg-dark-50 p-4">
                    <h2 className="text-lg font-semibold text-dark-900">Employee Payslips</h2>
                </div>

                <div className="overflow-x-auto">
                    {payrollPeriod.payslips.length === 0 ? (
                        <div className="p-8 text-center text-dark-500">
                            No payslips generated yet. Process payroll to generate payslips.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-dark-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Employee
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Base/Salary
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Regular Hours
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Overtime
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Gross Pay
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Deductions
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Net Pay
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-200 bg-white">
                                {payrollPeriod.payslips.map((payslip) => (
                                    <tr key={payslip.id} className="hover:bg-dark-50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-dark-900">
                                                    {payslip.user.name}
                                                </span>
                                                <span className="text-xs text-dark-500">
                                                    {payslip.user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-dark-900">
                                            {formatCurrency(payslip.base_salary)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-dark-900">
                                            <div className="flex flex-col">
                                                <span>{parseFloat(payslip.regular_hours).toFixed(2)}h</span>
                                                <span className="text-xs text-dark-500">
                                                    {formatCurrency(payslip.regular_pay)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-dark-900">
                                            <div className="flex flex-col">
                                                <span>{parseFloat(payslip.overtime_hours).toFixed(2)}h</span>
                                                <span className="text-xs text-dark-500">
                                                    {formatCurrency(payslip.overtime_pay)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-dark-900">
                                            {formatCurrency(payslip.gross_pay)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-warning-600">
                                            {formatCurrency(payslip.total_deductions)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-success-600">
                                            {formatCurrency(payslip.net_pay)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={PayrollController.showPayslip.url({
                                                    payslip: payslip.id,
                                                })}
                                                className="text-sm font-medium text-brand-600 hover:text-brand-700"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {showCancelDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <Card className="w-full max-w-md p-6">
                        <h3 className="mb-4 text-lg font-semibold text-dark-900">
                            Cancel Payroll Period
                        </h3>
                        <p className="mb-4 text-sm text-dark-600">
                            Please provide a reason for cancelling this payroll period.
                        </p>

                        <TextArea
                            name="reason"
                            placeholder="Enter cancellation reason..."
                            rows={4}
                            value={cancelReason}
                            onChange={(value) => setCancelReason(value)}
                        />

                        <div className="mt-6 flex gap-3">
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => {
                                    setShowCancelDialog(false);
                                    setCancelReason('');
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                variant="destructive"
                                fullWidth
                                onClick={handleCancel}
                                disabled={!cancelReason.trim()}
                            >
                                Cancel Payroll
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {showDeleteDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <Card className="w-full max-w-md p-6">
                        <h3 className="mb-4 text-lg font-semibold text-dark-900">
                            Delete Payroll Period
                        </h3>
                        <p className="mb-6 text-sm text-dark-600">
                            Are you sure you want to delete this payroll period? This action
                            cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => setShowDeleteDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button variant="destructive" fullWidth onClick={handleDelete}>
                                Delete
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}
