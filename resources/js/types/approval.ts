import { User } from './index';
import { Shop } from './shop';

export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected';

export type FundRequestStatus = 'pending' | 'approved' | 'rejected' | 'disbursed' | 'cancelled';

export type FundRequestType =
    | 'repairs'
    | 'fuel'
    | 'supplies'
    | 'inventory'
    | 'utilities'
    | 'maintenance'
    | 'equipment'
    | 'transportation'
    | 'other';

export interface ApprovalStep {
    role_level: number;
    role_name?: string;
    required?: boolean;
}

export interface ApprovalChain {
    id: number;
    tenant_id: number;
    name: string;
    entity_type: string;
    minimum_amount: number | null;
    maximum_amount: number | null;
    approval_steps: ApprovalStep[];
    is_active: boolean;
    priority: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApprovalHistoryEntry {
    step: number;
    user_id: number;
    user_name: string;
    action: string;
    notes: string | null;
    timestamp: string;
}

export interface ApprovalRequest {
    id: number;
    tenant_id: number;
    approval_chain_id: number;
    approvable_type: string;
    approvable_id: number;
    requested_by: number;
    status: ApprovalRequestStatus;
    current_step: number;
    approval_history: ApprovalHistoryEntry[];
    approved_by: number | null;
    approved_at: string | null;
    rejected_by: number | null;
    rejected_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;

    approvalChain?: ApprovalChain;
    requestedBy?: User;
    approvedByUser?: User;
    rejectedByUser?: User;
}

export interface FundRequest {
    id: number;
    user_id: number;
    shop_id: number;
    tenant_id: number;
    request_type: FundRequestType;
    amount: number;
    description: string | null;
    status: FundRequestStatus;
    requested_at: string;
    approved_by_user_id: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    disbursed_by_user_id: number | null;
    disbursed_at: string | null;
    receipt_uploaded: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    user?: User;
    shop?: Shop;
    approvedBy?: User;
    disbursedBy?: User;
}

export interface FundRequestTypeOption {
    value: FundRequestType;
    label: string;
    description: string;
    icon: string;
}

export interface FundRequestStatusOption {
    value: FundRequestStatus;
    label: string;
    color: string;
}

export interface ApprovalRequestStatusOption {
    value: ApprovalRequestStatus;
    label: string;
    color: string;
}
