/**
 * Centralized status configurations for all entities.
 * This is the SINGLE SOURCE OF TRUTH for status colors and labels.
 * DO NOT create local getStatusColor or status config objects in components.
 */

import { BadgeColor } from '@/components/ui/badge/Badge';

export interface StatusConfig {
    label: string;
    color: BadgeColor;
}

export const orderStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'warning' },
    confirmed: { label: 'Confirmed', color: 'info' },
    processing: { label: 'Processing', color: 'brand' },
    packed: { label: 'Packed', color: 'blue' },
    shipped: { label: 'Shipped', color: 'purple' },
    delivered: { label: 'Delivered', color: 'success' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
    refunded: { label: 'Refunded', color: 'gray' },
};

export const paymentStatusConfig: Record<string, StatusConfig> = {
    unpaid: { label: 'Unpaid', color: 'error' },
    pending: { label: 'Pending', color: 'warning' },
    partial: { label: 'Partial', color: 'warning' },
    paid: { label: 'Paid', color: 'success' },
    refunded: { label: 'Refunded', color: 'gray' },
    failed: { label: 'Failed', color: 'error' },
    overdue: { label: 'Overdue', color: 'error' },
    cancelled: { label: 'Cancelled', color: 'gray' },
};

export const payrollStatusConfig: Record<string, StatusConfig> = {
    draft: { label: 'Draft', color: 'light' },
    calculating: { label: 'Calculating', color: 'info' },
    pending_review: { label: 'Pending Review', color: 'warning' },
    pending_approval: { label: 'Pending Approval', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    processing: { label: 'Processing', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
    paid: { label: 'Paid', color: 'success' },
};

export const payRunStatusConfig: Record<string, StatusConfig> = {
    draft: { label: 'Draft', color: 'light' },
    calculating: { label: 'Calculating', color: 'info' },
    pending_review: { label: 'Pending Review', color: 'warning' },
    pending_approval: { label: 'Pending Approval', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    processing: { label: 'Processing', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
};

export const returnStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'error' },
    completed: { label: 'Completed', color: 'info' },
    processing: { label: 'Processing', color: 'brand' },
};

export const wageAdvanceStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'error' },
    disbursed: { label: 'Disbursed', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'light' },
    repaying: { label: 'Repaying', color: 'brand' },
};

export const fundRequestStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'error' },
    disbursed: { label: 'Disbursed', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'light' },
};

export const timesheetStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'error' },
    submitted: { label: 'Submitted', color: 'info' },
    draft: { label: 'Draft', color: 'light' },
};

export const purchaseOrderStatusConfig: Record<string, StatusConfig> = {
    draft: { label: 'Draft', color: 'primary' },
    submitted: { label: 'Pending Approval', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    processing: { label: 'Processing', color: 'warning' },
    shipped: { label: 'Shipped', color: 'success' },
    received: { label: 'Received', color: 'success' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
};

export const purchaseOrderPaymentStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'warning' },
    partial: { label: 'Partial', color: 'warning' },
    paid: { label: 'Paid', color: 'success' },
    overdue: { label: 'Overdue', color: 'error' },
    cancelled: { label: 'Cancelled', color: 'primary' },
};

export const connectionStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending Approval', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    active: { label: 'Active', color: 'success' },
    suspended: { label: 'Suspended', color: 'error' },
    rejected: { label: 'Rejected', color: 'error' },
    terminated: { label: 'Terminated', color: 'gray' },
};

export const activeStatusConfig: Record<string, StatusConfig> = {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'error' },
};

export const employmentStatusConfig: Record<string, StatusConfig> = {
    active: { label: 'Active', color: 'success' },
    on_leave: { label: 'On Leave', color: 'warning' },
    suspended: { label: 'Suspended', color: 'error' },
    terminated: { label: 'Terminated', color: 'gray' },
    resigned: { label: 'Resigned', color: 'gray' },
};

export const stockMovementTypeConfig: Record<string, StatusConfig> = {
    purchase: { label: 'Purchase', color: 'success' },
    sale: { label: 'Sale', color: 'info' },
    adjustment_in: { label: 'Adjustment In', color: 'success' },
    adjustment_out: { label: 'Adjustment Out', color: 'warning' },
    transfer_in: { label: 'Transfer In', color: 'blue' },
    transfer_out: { label: 'Transfer Out', color: 'purple' },
    return: { label: 'Return', color: 'info' },
    damage: { label: 'Damage', color: 'error' },
    loss: { label: 'Loss', color: 'error' },
    stock_take: { label: 'Stock Take', color: 'brand' },
    initial: { label: 'Initial Stock', color: 'gray' },
};

export const staffRoleConfig: Record<string, StatusConfig> = {
    owner: { label: 'Owner', color: 'error' },
    general_manager: { label: 'General Manager', color: 'info' },
    store_manager: { label: 'Store Manager', color: 'success' },
    assistant_manager: { label: 'Assistant Manager', color: 'warning' },
    sales_rep: { label: 'Sales Representative', color: 'info' },
    cashier: { label: 'Cashier', color: 'warning' },
    inventory_clerk: { label: 'Inventory Clerk', color: 'info' },
};

export const subscriptionPlanConfig: Record<string, StatusConfig> = {
    trial: { label: 'Trial', color: 'warning' },
    starter: { label: 'Starter', color: 'info' },
    basic: { label: 'Basic', color: 'info' },
    professional: { label: 'Professional', color: 'primary' },
    enterprise: { label: 'Enterprise', color: 'success' },
};

export const creditTransactionTypeConfig: Record<string, StatusConfig> = {
    charge: { label: 'Charge', color: 'error' },
    payment: { label: 'Payment', color: 'success' },
};

export const payFrequencyConfig: Record<string, StatusConfig> = {
    daily: { label: 'Daily', color: 'error' },
    weekly: { label: 'Weekly', color: 'warning' },
    bi_weekly: { label: 'Bi-Weekly', color: 'info' },
    semi_monthly: { label: 'Semi-Monthly', color: 'primary' },
    monthly: { label: 'Monthly', color: 'success' },
};

export const earningCategoryConfig: Record<string, StatusConfig> = {
    base: { label: 'Base', color: 'primary' },
    allowance: { label: 'Allowance', color: 'info' },
    bonus: { label: 'Bonus', color: 'success' },
    commission: { label: 'Commission', color: 'warning' },
    overtime: { label: 'Overtime', color: 'error' },
};

export const deductionCategoryConfig: Record<string, StatusConfig> = {
    statutory: { label: 'Statutory', color: 'error' },
    voluntary: { label: 'Voluntary', color: 'info' },
    loan: { label: 'Loan', color: 'warning' },
    advance: { label: 'Advance', color: 'warning' },
    benefit: { label: 'Benefit', color: 'success' },
};

export const payRunItemStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'light' },
    calculated: { label: 'Calculated', color: 'success' },
    error: { label: 'Error', color: 'error' },
    excluded: { label: 'Excluded', color: 'warning' },
};

export const addressTypeConfig: Record<string, StatusConfig> = {
    shipping: { label: 'Shipping', color: 'info' },
    billing: { label: 'Billing', color: 'warning' },
    both: { label: 'Both', color: 'success' },
};

export const receiptTypeConfig: Record<string, StatusConfig> = {
    order: { label: 'Order', color: 'primary' },
    payment: { label: 'Payment', color: 'success' },
};

export const catalogVisibilityConfig: Record<string, StatusConfig> = {
    public: { label: 'Public', color: 'success' },
    private: { label: 'Private', color: 'warning' },
    connections_only: { label: 'Connections Only', color: 'info' },
};

export function getStatusConfig<T extends string>(
    config: Record<T, StatusConfig>,
    status: T | string,
): StatusConfig {
    return config[status as T] || { label: status, color: 'gray' };
}

export function getStatusColor<T extends string>(
    config: Record<T, StatusConfig>,
    status: T | string,
): BadgeColor {
    return config[status as T]?.color || 'gray';
}

export function getStatusLabel<T extends string>(
    config: Record<T, StatusConfig>,
    status: T | string,
): string {
    return config[status as T]?.label || status;
}

export const getOrderStatusColor = (status: string): BadgeColor =>
    getStatusColor(orderStatusConfig, status);

export const getOrderStatusLabel = (status: string): string =>
    getStatusLabel(orderStatusConfig, status);

export const getPaymentStatusColor = (status: string): BadgeColor =>
    getStatusColor(paymentStatusConfig, status);

export const getPaymentStatusLabel = (status: string): string =>
    getStatusLabel(paymentStatusConfig, status);

export const getPayrollStatusColor = (status: string): BadgeColor =>
    getStatusColor(payrollStatusConfig, status);

export const getPayrollStatusLabel = (status: string): string =>
    getStatusLabel(payrollStatusConfig, status);

export const getPayRunStatusColor = (status: string): BadgeColor =>
    getStatusColor(payRunStatusConfig, status);

export const getPayRunStatusLabel = (status: string): string =>
    getStatusLabel(payRunStatusConfig, status);

export const getReturnStatusColor = (status: string): BadgeColor =>
    getStatusColor(returnStatusConfig, status);

export const getReturnStatusLabel = (status: string): string =>
    getStatusLabel(returnStatusConfig, status);

export const getWageAdvanceStatusColor = (status: string): BadgeColor =>
    getStatusColor(wageAdvanceStatusConfig, status);

export const getWageAdvanceStatusLabel = (status: string): string =>
    getStatusLabel(wageAdvanceStatusConfig, status);

export const getFundRequestStatusColor = (status: string): BadgeColor =>
    getStatusColor(fundRequestStatusConfig, status);

export const getFundRequestStatusLabel = (status: string): string =>
    getStatusLabel(fundRequestStatusConfig, status);

export const getTimesheetStatusColor = (status: string): BadgeColor =>
    getStatusColor(timesheetStatusConfig, status);

export const getTimesheetStatusLabel = (status: string): string =>
    getStatusLabel(timesheetStatusConfig, status);

export const getStockMovementTypeColor = (type: string): BadgeColor =>
    getStatusColor(stockMovementTypeConfig, type);

export const getStockMovementTypeLabel = (type: string): string =>
    getStatusLabel(stockMovementTypeConfig, type);

export const getPurchaseOrderStatusColor = (status: string): BadgeColor =>
    getStatusColor(purchaseOrderStatusConfig, status);

export const getPurchaseOrderStatusLabel = (status: string): string =>
    getStatusLabel(purchaseOrderStatusConfig, status);

export const getPurchaseOrderPaymentStatusColor = (status: string): BadgeColor =>
    getStatusColor(purchaseOrderPaymentStatusConfig, status);

export const getPurchaseOrderPaymentStatusLabel = (status: string): string =>
    getStatusLabel(purchaseOrderPaymentStatusConfig, status);

export const getConnectionStatusColor = (status: string): BadgeColor =>
    getStatusColor(connectionStatusConfig, status);

export const getConnectionStatusLabel = (status: string): string =>
    getStatusLabel(connectionStatusConfig, status);

export const getStaffRoleColor = (role: string): BadgeColor =>
    getStatusColor(staffRoleConfig, role);

export const getStaffRoleLabel = (role: string): string =>
    getStatusLabel(staffRoleConfig, role);

export const getSubscriptionPlanColor = (plan: string): BadgeColor =>
    getStatusColor(subscriptionPlanConfig, plan);

export const getSubscriptionPlanLabel = (plan: string): string =>
    getStatusLabel(subscriptionPlanConfig, plan);

export const getCreditTransactionTypeColor = (type: string): BadgeColor =>
    getStatusColor(creditTransactionTypeConfig, type);

export const getCreditTransactionTypeLabel = (type: string): string =>
    getStatusLabel(creditTransactionTypeConfig, type);

export const getPayFrequencyColor = (frequency: string): BadgeColor =>
    getStatusColor(payFrequencyConfig, frequency);

export const getPayFrequencyLabel = (frequency: string): string =>
    getStatusLabel(payFrequencyConfig, frequency);

export const getEarningCategoryColor = (category: string): BadgeColor =>
    getStatusColor(earningCategoryConfig, category);

export const getEarningCategoryLabel = (category: string): string =>
    getStatusLabel(earningCategoryConfig, category);

export const getDeductionCategoryColor = (category: string): BadgeColor =>
    getStatusColor(deductionCategoryConfig, category);

export const getDeductionCategoryLabel = (category: string): string =>
    getStatusLabel(deductionCategoryConfig, category);

export const getPayRunItemStatusColor = (status: string): BadgeColor =>
    getStatusColor(payRunItemStatusConfig, status);

export const getPayRunItemStatusLabel = (status: string): string =>
    getStatusLabel(payRunItemStatusConfig, status);

export const getAddressTypeColor = (type: string): BadgeColor =>
    getStatusColor(addressTypeConfig, type);

export const getAddressTypeLabel = (type: string): string =>
    getStatusLabel(addressTypeConfig, type);

export const getReceiptTypeColor = (type: string): BadgeColor =>
    getStatusColor(receiptTypeConfig, type);

export const getReceiptTypeLabel = (type: string): string =>
    getStatusLabel(receiptTypeConfig, type);

export const getCatalogVisibilityColor = (visibility: string): BadgeColor =>
    getStatusColor(catalogVisibilityConfig, visibility);

export const getCatalogVisibilityLabel = (visibility: string): string =>
    getStatusLabel(catalogVisibilityConfig, visibility);

export const onboardingStatusConfig: Record<string, StatusConfig> = {
    pending: { label: 'Pending', color: 'light' },
    in_progress: { label: 'Onboarding', color: 'warning' },
    completed: { label: 'Onboarded', color: 'success' },
};

export const getOnboardingStatusColor = (status: string): BadgeColor =>
    getStatusColor(onboardingStatusConfig, status);

export const getOnboardingStatusLabel = (status: string): string =>
    getStatusLabel(onboardingStatusConfig, status);

/**
 * Get stock severity based on percentage remaining.
 * Used for reorder alerts where severity is calculated from percentage, not a status string.
 */
export const getStockSeverity = (percentage: number): StatusConfig => {
    if (percentage < 25) return { label: 'Critical', color: 'error' };
    if (percentage < 50) return { label: 'Warning', color: 'warning' };
    return { label: 'Low', color: 'info' };
};

/**
 * Get credit usage status based on usage percentage.
 * Used for customer credit accounts where status is calculated from credit limit usage.
 */
export const getCreditUsageStatus = (usagePercent: number): StatusConfig => {
    if (usagePercent >= 90) return { label: 'Critical', color: 'error' };
    if (usagePercent >= 75) return { label: 'High', color: 'warning' };
    if (usagePercent >= 50) return { label: 'Moderate', color: 'info' };
    return { label: 'Good', color: 'success' };
};
