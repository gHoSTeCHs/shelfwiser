import { User } from '@/types/index';
import { Product, ProductVariant } from '@/types/product';
import { Shop } from '@/types/shop';

export type ConnectionApprovalMode = 'auto' | 'owner' | 'general_manager' | 'assistant_manager';

export type ConnectionStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'rejected';

export type CatalogVisibility = 'public' | 'private' | 'connections_only';

export type PurchaseOrderStatus =
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'processing'
    | 'shipped'
    | 'received'
    | 'completed'
    | 'cancelled';

export type PurchaseOrderPaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface Tenant {
    id: number;
    name: string;
    slug: string;
    owner_email: string;
    business_type: string | null;
    phone: string | null;
    logo_path: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SupplierProfile {
    id: number;
    tenant_id: number;
    is_enabled: boolean;
    business_registration: string | null;
    tax_id: string | null;
    payment_terms: string;
    lead_time_days: number;
    minimum_order_value: number;
    connection_approval_mode: ConnectionApprovalMode;
    settings: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    tenant?: Tenant;
}

export interface SupplierConnection {
    id: number;
    supplier_tenant_id: number;
    buyer_tenant_id: number;
    status: ConnectionStatus;
    credit_limit: number | null;
    payment_terms_override: string | null;
    buyer_notes: string | null;
    supplier_notes: string | null;
    requested_at: string;
    approved_at: string | null;
    approved_by: number | null;
    created_at: string;
    updated_at: string;
    supplier_tenant?: Tenant;
    buyer_tenant?: Tenant;
    approved_by_user?: User;
}

export interface SupplierPricingTier {
    id: number;
    catalog_item_id: number;
    connection_id: number | null;
    min_quantity: number;
    max_quantity: number | null;
    price: number;
    created_at: string;
    updated_at: string;
}

export interface SupplierCatalogItem {
    id: number;
    supplier_tenant_id: number;
    product_id: number;
    is_available: boolean;
    base_wholesale_price: number;
    min_order_quantity: number;
    visibility: CatalogVisibility;
    description: string | null;
    created_at: string;
    updated_at: string;
    supplier_tenant?: Tenant;
    product?: Product;
    pricing_tiers?: SupplierPricingTier[];
}

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_variant_id: number;
    catalog_item_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    received_quantity: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    product_variant?: ProductVariant & { product?: Product };
    catalog_item?: SupplierCatalogItem;
}

export interface PurchaseOrderPayment {
    id: number;
    purchase_order_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number: string | null;
    notes: string | null;
    recorded_by: number;
    created_at: string;
    updated_at: string;
    recorded_by_user?: User;
}

export interface PurchaseOrder {
    id: number;
    buyer_tenant_id: number;
    supplier_tenant_id: number;
    shop_id: number;
    po_number: string;
    status: PurchaseOrderStatus;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    expected_delivery_date: string | null;
    actual_delivery_date: string | null;
    buyer_notes: string | null;
    supplier_notes: string | null;
    payment_status: PurchaseOrderPaymentStatus;
    paid_amount: number;
    payment_due_date: string | null;
    payment_date: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    created_by: number;
    approved_by: number | null;
    shipped_by: number | null;
    received_by: number | null;
    submitted_at: string | null;
    approved_at: string | null;
    shipped_at: string | null;
    received_at: string | null;
    created_at: string;
    updated_at: string;
    buyer_tenant?: Tenant;
    supplier_tenant?: Tenant;
    shop?: Shop;
    items?: PurchaseOrderItem[];
    payments?: PurchaseOrderPayment[];
    created_by_user?: User;
    approved_by_user?: User;
    shipped_by_user?: User;
    received_by_user?: User;
}

export interface PurchaseOrderListResponse {
    data: PurchaseOrder[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface SupplierCatalogListResponse {
    data: SupplierCatalogItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ConnectionStatusOption {
    value: ConnectionStatus;
    label: string;
    color: string;
}

export interface PurchaseOrderStatusOption {
    value: PurchaseOrderStatus;
    label: string;
    color: string;
}

export interface PaymentStatusOption {
    value: PurchaseOrderPaymentStatus;
    label: string;
    color: string;
}
