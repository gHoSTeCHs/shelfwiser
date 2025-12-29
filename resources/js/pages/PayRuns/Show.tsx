import { Head, Link, router } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import PayRunController from '@/actions/App/Http/Controllers/PayRunController';
import {
    ArrowLeft,
    Calculator,
    Send,
    CheckCircle,
    XCircle,
    Download,
    Users,
    DollarSign,
    AlertTriangle,
    RefreshCw,
    UserMinus,
    UserPlus,
} from 'lucide-react';
import type { PayRun, PayRunItem, PayRunSummary } from '@/types/payroll';

interface Props {
    payRun: PayRun;
    summary: PayRunSummary;
}

export default function Show({ payRun, summary }: Props) {
    const [selectedItem, setSelectedItem] = useState<PayRunItem | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showExcludeModal, setShowExcludeModal] = useState(false);
    const [excludeReason, setExcludeReason] = useState('');
    const [excludeUserId, setExcludeUserId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(parseFloat(amount.toString()));
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'light';
            case 'calculating':
            case 'processing':
                return 'info';
            case 'pending_review':
            case 'pending_approval':
                return 'warning';
            case 'approved':
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'light';
        }
    };

    const getItemStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'light';
            case 'calculated':
                return 'success';
            case 'error':
                return 'error';
            case 'excluded':
                return 'warning';
            default:
                return 'light';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            draft: 'Draft',
            calculating: 'Calculating',
            pending_review: 'Pending Review',
            pending_approval: 'Pending Approval',
            approved: 'Approved',
            processing: 'Processing',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return labels[status] || status;
    };

    const canCalculate = payRun.status === 'draft' || payRun.status === 'pending_review';
    const canSubmit = payRun.status === 'pending_review' && summary.errors === 0;
    const canApprove = payRun.status === 'pending_approval';
    const canComplete = payRun.status === 'approved';
    const canCancel = ['draft', 'pending_review', 'pending_approval'].includes(payRun.status);

    return (
        <>
            <Head title={`Pay Run ${payRun.reference}`} />

            <div className="mb-6">
                <Link href={PayRunController.index.url()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        startIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back to Pay Runs
                    </Button>
                </Link>
            </div>

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {payRun.reference}
                        </h1>
                        <Badge color={getStatusColor(payRun.status)} size="md">
                            {getStatusLabel(payRun.status)}
                        </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {payRun.name} • {payRun.payroll_period?.period_name}
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {canCalculate && (
                        <Form action={PayRunController.calculate.url({ payRun: payRun.id })} method="post">
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    startIcon={<Calculator className="h-4 w-4" />}
                                    disabled={processing}
                                    loading={processing}
                                    className="w-full sm:w-auto"
                                >
                                    Calculate
                                </Button>
                            )}
                        </Form>
                    )}

                    {canSubmit && (
                        <Form action={PayRunController.submitForApproval.url({ payRun: payRun.id })} method="post">
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    startIcon={<Send className="h-4 w-4" />}
                                    disabled={processing}
                                    loading={processing}
                                    className="w-full sm:w-auto"
                                >
                                    Submit for Approval
                                </Button>
                            )}
                        </Form>
                    )}

                    {canApprove && (
                        <>
                            <Form action={PayRunController.approve.url({ payRun: payRun.id })} method="post">
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        startIcon={<CheckCircle className="h-4 w-4" />}
                                        disabled={processing}
                                        loading={processing}
                                        className="w-full sm:w-auto"
                                    >
                                        Approve
                                    </Button>
                                )}
                            </Form>
                            <Button
                                variant="outline"
                                startIcon={<XCircle className="h-4 w-4" />}
                                onClick={() => setShowRejectModal(true)}
                                className="w-full sm:w-auto"
                            >
                                Reject
                            </Button>
                        </>
                    )}

                    {canComplete && (
                        <Form action={PayRunController.complete.url({ payRun: payRun.id })} method="post">
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    startIcon={<CheckCircle className="h-4 w-4" />}
                                    disabled={processing}
                                    loading={processing}
                                    className="w-full sm:w-auto"
                                >
                                    Complete &amp; Generate Payslips
                                </Button>
                            )}
                        </Form>
                    )}

                    {payRun.status === 'completed' && (
                        <Form action={PayRunController.downloadPayslips.url({ payRun: payRun.id })} method="post">
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    startIcon={<Download className="h-4 w-4" />}
                                    disabled={processing}
                                    loading={processing}
                                    className="w-full sm:w-auto"
                                >
                                    Download Payslips
                                </Button>
                            )}
                        </Form>
                    )}

                    {canCancel && (
                        <Button
                            variant="destructive"
                            startIcon={<XCircle className="h-4 w-4" />}
                            onClick={() => {
                                if (confirm('Are you sure you want to cancel this pay run?')) {
                                    setErrorMessage(null);
                                    router.post(PayRunController.cancel.url({ payRun: payRun.id }), {}, {
                                        onError: (errors) => {
                                            setErrorMessage(Object.values(errors).flat().join(', ') || 'Failed to cancel pay run');
                                        },
                                    });
                                }
                            }}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Employees</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {summary.total_employees}
                            </p>
                        </div>
                        <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                        <span className="text-success-600">{summary.calculated} calculated</span>
                        {summary.errors > 0 && (
                            <span className="text-error-600">{summary.errors} errors</span>
                        )}
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Gross</p>
                            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(summary.totals.gross)}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Deductions</p>
                            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(summary.totals.deductions)}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-warning-400" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Net</p>
                            <p className="mt-1 text-xl font-bold text-success-600 dark:text-success-400">
                                {formatCurrency(summary.totals.net)}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-success-400" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Employer Costs</p>
                            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(summary.totals.employer_costs)}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                </Card>
            </div>

            {errorMessage && (
                <div className="mb-6 rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-error-600 dark:text-error-400" />
                        <span className="text-error-600 dark:text-error-400">{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="ml-auto inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-error-600 hover:text-error-800 dark:text-error-400"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <Card className="overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Pay Details</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Employee
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Basic
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Gross
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Deductions
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Net Pay
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
                            {payRun.items?.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                        item.status === 'error' ? 'bg-error-50 dark:bg-error-900/10' : ''
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {item.user?.name || 'Unknown'}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {item.user?.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(item.basic_salary)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(item.gross_earnings)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(item.total_deductions)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                        {formatCurrency(item.net_pay)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <Badge color={getItemStatusColor(item.status)} size="sm">
                                                {item.status}
                                            </Badge>
                                            {item.error_message && (
                                                <span className="text-xs text-error-600 dark:text-error-400">
                                                    {item.error_message}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {canCalculate && (item.status === 'pending' || item.status === 'error') && (
                                                <Form
                                                    action={PayRunController.recalculateItem.url({
                                                        payRun: payRun.id,
                                                        item: item.id,
                                                    })}
                                                    method="post"
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={processing}
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </Form>
                                            )}
                                            {canCalculate && item.status === 'calculated' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setExcludeUserId(item.user_id);
                                                        setShowExcludeModal(true);
                                                    }}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {canCalculate && item.status === 'excluded' && (
                                                <Form
                                                    action={PayRunController.include.url({
                                                        payRun: payRun.id,
                                                        user: item.user_id,
                                                    })}
                                                    method="post"
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={processing}
                                                        >
                                                            <UserPlus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </Form>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {payRun.notes && (
                <Card className="mt-6 p-6">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
                    <p className="text-gray-600 dark:text-gray-300">{payRun.notes}</p>
                </Card>
            )}

            <Card className="mt-6 p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Timeline</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Created</span>
                        <span className="text-gray-900 dark:text-white">{formatDate(payRun.created_at)}</span>
                    </div>
                    {payRun.calculated_at && (
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Calculated</span>
                            <span className="text-gray-900 dark:text-white">
                                {formatDate(payRun.calculated_at)}
                                {payRun.calculated_by_user && ` by ${payRun.calculated_by_user.name}`}
                            </span>
                        </div>
                    )}
                    {payRun.approved_at && (
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Approved</span>
                            <span className="text-gray-900 dark:text-white">
                                {formatDate(payRun.approved_at)}
                                {payRun.approved_by_user && ` by ${payRun.approved_by_user.name}`}
                            </span>
                        </div>
                    )}
                    {payRun.completed_at && (
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Completed</span>
                            <span className="text-gray-900 dark:text-white">
                                {formatDate(payRun.completed_at)}
                                {payRun.completed_by_user && ` by ${payRun.completed_by_user.name}`}
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                                {selectedItem.user?.name} - Pay Details
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                                <XCircle className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            <div>
                                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Earnings</h4>
                                <div className="space-y-2">
                                    {selectedItem.earnings_breakdown?.map((earning, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{earning.type}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(earning.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                                        <span>Total Gross</span>
                                        <span>{formatCurrency(selectedItem.gross_earnings)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Deductions</h4>
                                <div className="space-y-2">
                                    {selectedItem.deductions_breakdown?.map((deduction, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{deduction.type}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(deduction.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                                        <span>Total Deductions</span>
                                        <span>{formatCurrency(selectedItem.total_deductions)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-success-800 dark:text-success-200">
                                    Net Pay
                                </span>
                                <span className="text-2xl font-bold text-success-600 dark:text-success-400">
                                    {formatCurrency(selectedItem.net_pay)}
                                </span>
                            </div>
                        </div>

                        {selectedItem.tax_calculation && (
                            <div className="mt-4">
                                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Tax Calculation</h4>
                                <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                                    <div className="flex justify-between">
                                        <span>Taxable Income</span>
                                        <span>{formatCurrency(selectedItem.tax_calculation.taxable_income)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Relief Applied</span>
                                        <span>{formatCurrency(selectedItem.tax_calculation.consolidated_relief)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                        <span>PAYE Tax</span>
                                        <span>{formatCurrency(selectedItem.tax_calculation.tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                        <span>Effective Rate</span>
                                        <span>{selectedItem.tax_calculation.effective_rate.toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} className="mx-4 w-full max-w-md">
                <div className="p-4 sm:p-6">
                    <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                        Reject Pay Run
                    </h3>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reason for Rejection
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:px-4"
                            placeholder="Enter reason for rejection..."
                        />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <Button variant="outline" onClick={() => setShowRejectModal(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Form
                            action={PayRunController.reject.url({ payRun: payRun.id })}
                            method="post"
                            className="w-full sm:w-auto"
                        >
                            <input type="hidden" name="reason" value={rejectReason} />
                            <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                                Reject
                            </Button>
                        </Form>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showExcludeModal} onClose={() => setShowExcludeModal(false)} className="mx-4 w-full max-w-md">
                <div className="p-4 sm:p-6">
                    <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                        Exclude Employee
                    </h3>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reason for Exclusion
                        </label>
                        <textarea
                            value={excludeReason}
                            onChange={(e) => setExcludeReason(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:px-4"
                            placeholder="Enter reason for exclusion..."
                        />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <Button variant="outline" onClick={() => setShowExcludeModal(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Form
                            action={PayRunController.excludeEmployee.url({ payRun: payRun.id, user: excludeUserId })}
                            method="post"
                            className="w-full sm:w-auto"
                        >
                            <input type="hidden" name="reason" value={excludeReason} />
                            <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                                Exclude
                            </Button>
                        </Form>
                    </div>
                </div>
            </Modal>
        </>
    );
}

Show.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
