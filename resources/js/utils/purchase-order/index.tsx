import {
    PurchaseOrderPaymentStatus,
    PurchaseOrderStatus,
} from '@/types/supplier.ts';
import { BadgeColor } from '@/components/ui/badge/Badge.tsx';

export const statusConfig: Record<
    PurchaseOrderStatus,
    {
        label: string;
        color: BadgeColor;
    }
> = {
    draft: { label: 'Draft', color: 'gray' },
    submitted: { label: 'Submitted', color: 'info' },
    approved: { label: 'Approved', color: 'success' },
    processing: { label: 'Processing', color: 'brand' },
    shipped: { label: 'Shipped', color: 'purple' },
    received: { label: 'Received', color: 'blue' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
};

export const paymentStatusConfig: Record<
    PurchaseOrderPaymentStatus,
    {
        label: string;
        color: BadgeColor;
    }
> = {
    pending: { label: 'Pending', color: 'warning' },
    partial: { label: 'Partial', color: 'info' },
    paid: { label: 'Paid', color: 'success' },
    overdue: { label: 'Overdue', color: 'error' },
    cancelled: { label: 'Cancelled', color: 'gray' },
};
