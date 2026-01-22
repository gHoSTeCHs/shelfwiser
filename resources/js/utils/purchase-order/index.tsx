/**
 * Purchase order utilities.
 * Re-exports status configs from centralized location for backward compatibility.
 */
export {
    purchaseOrderStatusConfig as statusConfig,
    purchaseOrderPaymentStatusConfig as paymentStatusConfig,
} from '@/lib/status-configs';
