import { ProductVariant } from './stockMovement';
import { Shop } from './shop';
import { User } from '@/types/index';

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export type PaymentStatus =
    | 'unpaid'
    | 'partial'
    | 'paid'
    | 'refunded'
    | 'failed'
    | 'cancelled';

export interface OrderItem {
    id: number;
    order_id: number;
    product_variant_id: number;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    product_variant?: ProductVariant;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: number;
    tenant_id: number;
    shop_id: number;
    customer_id: number | null;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string | null;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    shipping_cost: number;
    total_amount: number;
    customer_notes: string | null;
    internal_notes: string | null;
    shipping_address: string | null;
    billing_address: string | null;
    confirmed_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    shop?: Shop;
    customer?: User;
    items?: OrderItem[];
    items_count?: number;
    created_by_user?: User;
}

export interface OrderStats {
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
}

export interface OrderListResponse {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface OrderStatusOption {
    value: OrderStatus;
    label: string;
}

export interface PaymentStatusOption {
    value: PaymentStatus;
    label: string;
}
