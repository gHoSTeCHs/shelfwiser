<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Create a notification for a specific user
     */
    public function createForUser(
        User $user,
        NotificationType $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        ?Model $notifiable = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'tenant_id' => $user->tenant_id,
            'shop_id' => $user->shops->first()?->id,
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'notifiable_type' => $notifiable ? get_class($notifiable) : null,
            'notifiable_id' => $notifiable?->id,
            'data' => $data,
            'minimum_role_level' => null,
        ]);
    }

    /**
     * Create a notification for users with a minimum role level
     */
    public function createForRole(
        int $tenantId,
        NotificationType $type,
        string $title,
        string $message,
        int $minimumRoleLevel,
        ?int $shopId = null,
        ?string $actionUrl = null,
        ?Model $notifiable = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'tenant_id' => $tenantId,
            'shop_id' => $shopId,
            'user_id' => null,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'notifiable_type' => $notifiable ? get_class($notifiable) : null,
            'notifiable_id' => $notifiable?->id,
            'data' => $data,
            'minimum_role_level' => $minimumRoleLevel,
        ]);
    }

    /**
     * Get notifications for a user
     */
    public function getForUser(User $user, int $limit = 20, bool $unreadOnly = false): Collection
    {
        $query = Notification::query()
            ->forUser($user)
            ->with(['shop', 'notifiable'])
            ->orderByDesc('created_at')
            ->limit($limit);

        if ($unreadOnly) {
            $query->unread();
        }

        return $query->get();
    }

    /**
     * Get unread count for a user
     */
    public function getUnreadCount(User $user): int
    {
        return Notification::query()
            ->forUser($user)
            ->unread()
            ->count();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(User $user): void
    {
        Notification::query()
            ->forUser($user)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Delete notification
     */
    public function delete(Notification $notification): void
    {
        $notification->delete();
    }

    /**
     * Delete all read notifications for a user
     */
    public function deleteAllRead(User $user): void
    {
        Notification::query()
            ->forUser($user)
            ->read()
            ->delete();
    }

    /**
     * Notify about payroll being processed
     */
    public function notifyPayrollProcessed($payrollPeriod, User $processor): void
    {
        $minimumLevel = NotificationType::PAYROLL_PROCESSED->minimumRoleLevel();

        if ($minimumLevel) {
            $this->createForRole(
                tenantId: $payrollPeriod->tenant_id,
                type: NotificationType::PAYROLL_PROCESSED,
                title: 'Payroll Processed',
                message: "Payroll period '{$payrollPeriod->period_name}' has been processed by {$processor->name}.",
                minimumRoleLevel: $minimumLevel,
                shopId: $payrollPeriod->shop_id,
                actionUrl: route('payroll.show', $payrollPeriod),
                notifiable: $payrollPeriod,
                data: [
                    'period_name' => $payrollPeriod->period_name,
                    'employee_count' => $payrollPeriod->employee_count,
                    'total_net_pay' => $payrollPeriod->total_net_pay,
                ]
            );
        }
    }

    /**
     * Notify about payroll being approved
     */
    public function notifyPayrollApproved($payrollPeriod, User $approver): void
    {
        $minimumLevel = NotificationType::PAYROLL_APPROVED->minimumRoleLevel();

        if ($minimumLevel) {
            $this->createForRole(
                tenantId: $payrollPeriod->tenant_id,
                type: NotificationType::PAYROLL_APPROVED,
                title: 'Payroll Approved',
                message: "Payroll period '{$payrollPeriod->period_name}' has been approved by {$approver->name}.",
                minimumRoleLevel: $minimumLevel,
                shopId: $payrollPeriod->shop_id,
                actionUrl: route('payroll.show', $payrollPeriod),
                notifiable: $payrollPeriod
            );
        }
    }

    /**
     * Notify employees about payroll being paid
     */
    public function notifyPayrollPaid($payrollPeriod): void
    {
        foreach ($payrollPeriod->payslips as $payslip) {
            $this->createForUser(
                user: $payslip->user,
                type: NotificationType::PAYROLL_PAID,
                title: 'Payment Processed',
                message: "Your payment for '{$payrollPeriod->period_name}' has been processed. Net pay: ₦" . number_format($payslip->net_pay, 2),
                actionUrl: route('payroll.show-payslip', $payslip),
                notifiable: $payslip,
                data: [
                    'net_pay' => $payslip->net_pay,
                    'payment_date' => $payrollPeriod->payment_date,
                ]
            );
        }
    }

    /**
     * Notify about timesheet being submitted
     */
    public function notifyTimesheetSubmitted($timesheet): void
    {
        $minimumLevel = NotificationType::TIMESHEET_SUBMITTED->minimumRoleLevel();

        if ($minimumLevel) {
            $this->createForRole(
                tenantId: $timesheet->tenant_id,
                type: NotificationType::TIMESHEET_SUBMITTED,
                title: 'Timesheet Submitted',
                message: "{$timesheet->user->name} has submitted a timesheet for approval.",
                minimumRoleLevel: $minimumLevel,
                shopId: $timesheet->shop_id,
                actionUrl: route('timesheets.show', $timesheet),
                notifiable: $timesheet,
                data: [
                    'employee_name' => $timesheet->user->name,
                    'total_hours' => $timesheet->total_hours,
                ]
            );
        }
    }

    /**
     * Notify employee about timesheet approval
     */
    public function notifyTimesheetApproved($timesheet, User $approver): void
    {
        $this->createForUser(
            user: $timesheet->user,
            type: NotificationType::TIMESHEET_APPROVED,
            title: 'Timesheet Approved',
            message: "Your timesheet has been approved by {$approver->name}.",
            actionUrl: route('timesheets.show', $timesheet),
            notifiable: $timesheet,
            data: [
                'total_hours' => $timesheet->total_hours,
                'approved_by' => $approver->name,
            ]
        );
    }

    /**
     * Notify employee about timesheet rejection
     */
    public function notifyTimesheetRejected($timesheet, User $rejector, ?string $reason = null): void
    {
        $message = "Your timesheet has been rejected by {$rejector->name}.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        $this->createForUser(
            user: $timesheet->user,
            type: NotificationType::TIMESHEET_REJECTED,
            title: 'Timesheet Rejected',
            message: $message,
            actionUrl: route('timesheets.show', $timesheet),
            notifiable: $timesheet,
            data: [
                'rejection_reason' => $reason,
                'rejected_by' => $rejector->name,
            ]
        );
    }

    /**
     * Notify about fund request being submitted
     */
    public function notifyFundRequestSubmitted($fundRequest): void
    {
        $minimumLevel = NotificationType::FUND_REQUEST_SUBMITTED->minimumRoleLevel();

        if ($minimumLevel) {
            $this->createForRole(
                tenantId: $fundRequest->tenant_id,
                type: NotificationType::FUND_REQUEST_SUBMITTED,
                title: 'Fund Request Submitted',
                message: "{$fundRequest->user->name} has submitted a {$fundRequest->request_type->label()} request for ₦" . number_format($fundRequest->amount, 2),
                minimumRoleLevel: $minimumLevel,
                shopId: $fundRequest->shop_id,
                actionUrl: route('fund-requests.show', $fundRequest),
                notifiable: $fundRequest,
                data: [
                    'requester_name' => $fundRequest->user->name,
                    'amount' => $fundRequest->amount,
                    'type' => $fundRequest->request_type->value,
                ]
            );
        }
    }

    /**
     * Notify requester about fund request approval
     */
    public function notifyFundRequestApproved($fundRequest, User $approver): void
    {
        $this->createForUser(
            user: $fundRequest->user,
            type: NotificationType::FUND_REQUEST_APPROVED,
            title: 'Fund Request Approved',
            message: "Your {$fundRequest->request_type->label()} request for ₦" . number_format($fundRequest->amount, 2) . " has been approved by {$approver->name}.",
            actionUrl: route('fund-requests.show', $fundRequest),
            notifiable: $fundRequest,
            data: [
                'amount' => $fundRequest->amount,
                'approved_by' => $approver->name,
            ]
        );
    }

    /**
     * Notify requester about fund request rejection
     */
    public function notifyFundRequestRejected($fundRequest, User $rejector, ?string $reason = null): void
    {
        $message = "Your {$fundRequest->request_type->label()} request has been rejected by {$rejector->name}.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        $this->createForUser(
            user: $fundRequest->user,
            type: NotificationType::FUND_REQUEST_REJECTED,
            title: 'Fund Request Rejected',
            message: $message,
            actionUrl: route('fund-requests.show', $fundRequest),
            notifiable: $fundRequest,
            data: [
                'rejection_reason' => $reason,
                'rejected_by' => $rejector->name,
            ]
        );
    }

    /**
     * Notify requester about fund disbursement
     */
    public function notifyFundRequestDisbursed($fundRequest, User $disbursedBy): void
    {
        $this->createForUser(
            user: $fundRequest->user,
            type: NotificationType::FUND_REQUEST_DISBURSED,
            title: 'Funds Disbursed',
            message: "Your {$fundRequest->request_type->label()} request for ₦" . number_format($fundRequest->amount, 2) . " has been disbursed.",
            actionUrl: route('fund-requests.show', $fundRequest),
            notifiable: $fundRequest,
            data: [
                'amount' => $fundRequest->amount,
                'disbursed_by' => $disbursedBy->name,
            ]
        );
    }

    /**
     * Notify about wage advance request
     */
    public function notifyWageAdvanceRequested($wageAdvance): void
    {
        $minimumLevel = NotificationType::WAGE_ADVANCE_REQUESTED->minimumRoleLevel();

        if ($minimumLevel) {
            $this->createForRole(
                tenantId: $wageAdvance->tenant_id,
                type: NotificationType::WAGE_ADVANCE_REQUESTED,
                title: 'Wage Advance Requested',
                message: "{$wageAdvance->user->name} has requested a wage advance of ₦" . number_format($wageAdvance->amount_requested, 2),
                minimumRoleLevel: $minimumLevel,
                shopId: $wageAdvance->shop_id,
                actionUrl: route('wage-advances.show', $wageAdvance),
                notifiable: $wageAdvance,
                data: [
                    'requester_name' => $wageAdvance->user->name,
                    'amount_requested' => $wageAdvance->amount_requested,
                ]
            );
        }
    }

    /**
     * Notify employee about wage advance approval
     */
    public function notifyWageAdvanceApproved($wageAdvance, User $approver): void
    {
        $this->createForUser(
            user: $wageAdvance->user,
            type: NotificationType::WAGE_ADVANCE_APPROVED,
            title: 'Wage Advance Approved',
            message: "Your wage advance request for ₦" . number_format($wageAdvance->amount_approved, 2) . " has been approved by {$approver->name}.",
            actionUrl: route('wage-advances.show', $wageAdvance),
            notifiable: $wageAdvance,
            data: [
                'amount_approved' => $wageAdvance->amount_approved,
                'approved_by' => $approver->name,
            ]
        );
    }

    /**
     * Notify employee about wage advance rejection
     */
    public function notifyWageAdvanceRejected($wageAdvance, User $rejector, ?string $reason = null): void
    {
        $message = "Your wage advance request has been rejected by {$rejector->name}.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        $this->createForUser(
            user: $wageAdvance->user,
            type: NotificationType::WAGE_ADVANCE_REJECTED,
            title: 'Wage Advance Rejected',
            message: $message,
            actionUrl: route('wage-advances.show', $wageAdvance),
            notifiable: $wageAdvance,
            data: [
                'rejection_reason' => $reason,
                'rejected_by' => $rejector->name,
            ]
        );
    }

    /**
     * Notify employee about wage advance disbursement
     */
    public function notifyWageAdvanceDisbursed($wageAdvance): void
    {
        $this->createForUser(
            user: $wageAdvance->user,
            type: NotificationType::WAGE_ADVANCE_DISBURSED,
            title: 'Wage Advance Disbursed',
            message: "Your wage advance of ₦" . number_format($wageAdvance->amount_approved, 2) . " has been disbursed.",
            actionUrl: route('wage-advances.show', $wageAdvance),
            notifiable: $wageAdvance,
            data: [
                'amount' => $wageAdvance->amount_approved,
                'repayment_installments' => $wageAdvance->repayment_installments,
            ]
        );
    }
}
