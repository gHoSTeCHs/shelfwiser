import { User } from '@/types/index';
import { Order, OrderItem } from './order';

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ReturnItem {
    id: number;
    return_id: number;
    order_item_id: number;
    quantity: number;
    reason: string | null;
    condition_notes: string | null;
    created_at: string;
    updated_at: string;
    order_item?: OrderItem;
}

export interface OrderReturn {
    id: number;
    tenant_id: number;
    order_id: number;
    customer_id: number | null;
    return_number: string;
    status: ReturnStatus;
    reason: string;
    notes: string | null;
    refund_amount: number | null;
    restocked: boolean;
    created_by: number;
    approved_by: number | null;
    rejected_by: number | null;
    completed_by: number | null;
    approved_at: string | null;
    rejected_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    order?: Order;
    items?: ReturnItem[];
    created_by_user?: User;
    approved_by_user?: User;
    rejected_by_user?: User;
    completed_by_user?: User;
}

export interface ReturnListResponse {
    data: OrderReturn[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ReturnStatusOption {
    value: ReturnStatus;
    label: string;
}
