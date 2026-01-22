import { User } from './index';
import { Shop } from './shop';

export type NotificationType =
    | 'payroll_processed'
    | 'payroll_approved'
    | 'payroll_paid'
    | 'payroll_cancelled'
    | 'timesheet_submitted'
    | 'timesheet_approved'
    | 'timesheet_rejected'
    | 'timesheet_paid'
    | 'fund_request_submitted'
    | 'fund_request_approved'
    | 'fund_request_rejected'
    | 'fund_request_disbursed'
    | 'fund_request_cancelled'
    | 'wage_advance_requested'
    | 'wage_advance_approved'
    | 'wage_advance_rejected'
    | 'wage_advance_disbursed'
    | 'wage_advance_repayment_recorded'
    | 'wage_advance_fully_repaid';

export interface Notification {
    id: number;
    tenant_id: number;
    shop_id: number | null;
    user_id: number | null;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    action_url: string | null;
    is_read: boolean;
    read_at: string | null;
    notifiable_type: string | null;
    notifiable_id: number | null;
    minimum_role_level: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    user?: User;
    shop?: Shop;
}

export interface NotificationListResponse {
    data: Notification[];
    unread_count: number;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface NotificationTypeInfo {
    value: NotificationType;
    label: string;
    icon: string;
    color: string;
}
