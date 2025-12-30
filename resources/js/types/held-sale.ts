import { POSCartItem } from './sync';

export interface HeldSaleUser {
    id: number;
    name: string;
}

export interface HeldSaleCustomer {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
}

export interface HeldSale {
    id: number;
    tenant_id: number;
    shop_id: number;
    hold_reference: string;
    customer_id: number | null;
    customer: HeldSaleCustomer | null;
    items: POSCartItem[];
    notes: string | null;
    held_by: number;
    held_by_user: HeldSaleUser | null;
    expires_at: string | null;
    retrieved_at: string | null;
    retrieved_by: number | null;
    created_at: string;
    updated_at: string;
}

export interface HeldSalesResponse {
    held_sales: HeldSale[];
}

export interface HeldSaleResponse {
    held_sale: HeldSale;
    message: string;
}

export interface HeldSalesCountResponse {
    count: number;
}

export interface HoldSaleRequest {
    items: POSCartItem[];
    customer_id: number | null;
    notes: string | null;
}
