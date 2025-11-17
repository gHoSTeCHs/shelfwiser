<?php

namespace App\Enums;

enum NotificationType: string
{
    case PAYROLL_PROCESSED = 'payroll_processed';
    case PAYROLL_APPROVED = 'payroll_approved';
    case PAYROLL_PAID = 'payroll_paid';
    case PAYROLL_CANCELLED = 'payroll_cancelled';

    case TIMESHEET_SUBMITTED = 'timesheet_submitted';
    case TIMESHEET_APPROVED = 'timesheet_approved';
    case TIMESHEET_REJECTED = 'timesheet_rejected';
    case TIMESHEET_PAID = 'timesheet_paid';

    case FUND_REQUEST_SUBMITTED = 'fund_request_submitted';
    case FUND_REQUEST_APPROVED = 'fund_request_approved';
    case FUND_REQUEST_REJECTED = 'fund_request_rejected';
    case FUND_REQUEST_DISBURSED = 'fund_request_disbursed';
    case FUND_REQUEST_CANCELLED = 'fund_request_cancelled';

    case WAGE_ADVANCE_REQUESTED = 'wage_advance_requested';
    case WAGE_ADVANCE_APPROVED = 'wage_advance_approved';
    case WAGE_ADVANCE_REJECTED = 'wage_advance_rejected';
    case WAGE_ADVANCE_DISBURSED = 'wage_advance_disbursed';
    case WAGE_ADVANCE_REPAYMENT_RECORDED = 'wage_advance_repayment_recorded';
    case WAGE_ADVANCE_FULLY_REPAID = 'wage_advance_fully_repaid';

    /**
     * Get the display label for the notification type
     */
    public function label(): string
    {
        return match ($this) {
            self::PAYROLL_PROCESSED => 'Payroll Processed',
            self::PAYROLL_APPROVED => 'Payroll Approved',
            self::PAYROLL_PAID => 'Payroll Paid',
            self::PAYROLL_CANCELLED => 'Payroll Cancelled',
            self::TIMESHEET_SUBMITTED => 'Timesheet Submitted',
            self::TIMESHEET_APPROVED => 'Timesheet Approved',
            self::TIMESHEET_REJECTED => 'Timesheet Rejected',
            self::TIMESHEET_PAID => 'Timesheet Paid',
            self::FUND_REQUEST_SUBMITTED => 'Fund Request Submitted',
            self::FUND_REQUEST_APPROVED => 'Fund Request Approved',
            self::FUND_REQUEST_REJECTED => 'Fund Request Rejected',
            self::FUND_REQUEST_DISBURSED => 'Fund Request Disbursed',
            self::FUND_REQUEST_CANCELLED => 'Fund Request Cancelled',
            self::WAGE_ADVANCE_REQUESTED => 'Wage Advance Requested',
            self::WAGE_ADVANCE_APPROVED => 'Wage Advance Approved',
            self::WAGE_ADVANCE_REJECTED => 'Wage Advance Rejected',
            self::WAGE_ADVANCE_DISBURSED => 'Wage Advance Disbursed',
            self::WAGE_ADVANCE_REPAYMENT_RECORDED => 'Wage Advance Repayment',
            self::WAGE_ADVANCE_FULLY_REPAID => 'Wage Advance Repaid',
        };
    }

    /**
     * Get the icon name for the notification type
     */
    public function icon(): string
    {
        return match ($this) {
            self::PAYROLL_PROCESSED, self::PAYROLL_APPROVED => 'file-text',
            self::PAYROLL_PAID => 'check-circle',
            self::PAYROLL_CANCELLED => 'x-circle',
            self::TIMESHEET_SUBMITTED => 'clock',
            self::TIMESHEET_APPROVED => 'check-circle',
            self::TIMESHEET_REJECTED => 'x-circle',
            self::TIMESHEET_PAID => 'dollar-sign',
            self::FUND_REQUEST_SUBMITTED => 'file-plus',
            self::FUND_REQUEST_APPROVED => 'check-circle',
            self::FUND_REQUEST_REJECTED => 'x-circle',
            self::FUND_REQUEST_DISBURSED => 'dollar-sign',
            self::FUND_REQUEST_CANCELLED => 'x-circle',
            self::WAGE_ADVANCE_REQUESTED => 'hand-coins',
            self::WAGE_ADVANCE_APPROVED => 'check-circle',
            self::WAGE_ADVANCE_REJECTED => 'x-circle',
            self::WAGE_ADVANCE_DISBURSED => 'dollar-sign',
            self::WAGE_ADVANCE_REPAYMENT_RECORDED, self::WAGE_ADVANCE_FULLY_REPAID => 'trending-up',
        };
    }

    /**
     * Get the color variant for the notification type
     */
    public function color(): string
    {
        return match ($this) {
            self::PAYROLL_APPROVED, self::PAYROLL_PAID,
            self::TIMESHEET_APPROVED, self::TIMESHEET_PAID,
            self::FUND_REQUEST_APPROVED, self::FUND_REQUEST_DISBURSED,
            self::WAGE_ADVANCE_APPROVED, self::WAGE_ADVANCE_DISBURSED,
            self::WAGE_ADVANCE_FULLY_REPAID => 'success',

            self::PAYROLL_CANCELLED, self::TIMESHEET_REJECTED,
            self::FUND_REQUEST_REJECTED, self::FUND_REQUEST_CANCELLED,
            self::WAGE_ADVANCE_REJECTED => 'error',

            self::PAYROLL_PROCESSED => 'info',

            self::TIMESHEET_SUBMITTED, self::FUND_REQUEST_SUBMITTED,
            self::WAGE_ADVANCE_REQUESTED => 'warning',

            default => 'light',
        };
    }

    /**
     * Determine if this notification type is for management only
     */
    public function isManagementOnly(): bool
    {
        return match ($this) {
            self::PAYROLL_PROCESSED, self::PAYROLL_APPROVED, self::PAYROLL_PAID,
            self::TIMESHEET_SUBMITTED, self::FUND_REQUEST_SUBMITTED,
            self::WAGE_ADVANCE_REQUESTED => true,
            default => false,
        };
    }

    /**
     * Get the minimum role level required to see this notification
     * Returns null if the notification is user-specific
     */
    public function minimumRoleLevel(): ?int
    {
        if (!$this->isManagementOnly()) {
            return null;
        }

        return match ($this) {
            self::PAYROLL_PROCESSED, self::PAYROLL_APPROVED, self::PAYROLL_PAID => 80,
            self::TIMESHEET_SUBMITTED => 50,
            self::FUND_REQUEST_SUBMITTED, self::WAGE_ADVANCE_REQUESTED => 60,
            default => null,
        };
    }
}
