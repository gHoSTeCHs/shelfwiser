/**
 * Types for offline sync and POS operations
 */

export interface SyncProduct {
    id: number;
    product_id: number;
    tenant_id: number;
    shop_id: number;
    product_name: string;
    variant_name: string | null;
    display_name: string;
    sku: string;
    barcode: string | null;
    price: number;
    cost_price: number;
    stock_quantity: number;
    available_stock: number;
    track_stock: boolean;
    reorder_level: number | null;
    is_taxable: boolean;
    is_active: boolean;
    image_url: string | null;
    packaging_types: SyncPackagingType[];
    updated_at: string;
}

export interface SyncPackagingType {
    id: number;
    name: string;
    display_name: string;
    units_per_package: number;
    price: number;
    is_base_unit: boolean;
    can_break_down: boolean;
}

export interface SyncCustomer {
    id: number;
    tenant_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    updated_at: string;
}

export interface OfflineOrder {
    offline_id: string;
    shop_id: number;
    items: OfflineOrderItem[];
    customer_id: number | null;
    payment_method: string;
    amount_tendered: number;
    discount_amount: number;
    notes: string | null;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    created_at: string;
}

export interface OfflineOrderItem {
    variant_id: number;
    quantity: number;
    unit_price: number;
    packaging_type_id?: number;
    discount_amount?: number;
}

export interface SyncOrderResult {
    offline_id: string;
    success: boolean;
    order_id?: number;
    order_number?: string;
    has_stock_issues?: boolean;
    stock_issues?: StockIssue[];
    reason?: string;
    message?: string;
}

export interface StockIssue {
    variant_id: number;
    sku: string;
    requested: number;
    available: number;
}

export interface SyncStatus {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: number | null;
    error: string | null;
}

export interface POSCart {
    id: string;
    shop_id: number;
    items: POSCartItem[];
    customer_id: number | null;
    discount: number;
    notes: string;
    updated_at: number;
}

export interface POSCartItem {
    variant_id: number;
    name: string;
    sku: string;
    barcode: string | null;
    quantity: number;
    unit_price: number;
    packaging_type_id?: number;
    discount_amount?: number;
}
