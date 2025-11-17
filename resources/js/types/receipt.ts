import { Order } from './order';
import { Shop } from './shop';
import { User } from './index';

export type ReceiptType = 'order' | 'payment';

export interface Receipt {
    id: number;
    tenant_id: number;
    shop_id: number;
    order_id: number | null;
    order_payment_id: number | null;
    customer_id: number | null;
    receipt_number: string;
    type: ReceiptType;
    amount: number;
    pdf_path: string | null;
    generated_at: string;
    emailed_at: string | null;
    emailed_to: string | null;
    generated_by: number;
    created_at: string;
    updated_at: string;
    order?: Order;
    order_payment?: OrderPayment;
    customer?: Customer;
    shop?: Shop;
    generated_by_user?: User;
}

export interface OrderPayment {
    id: number;
    order_id: number;
    tenant_id: number;
    shop_id: number;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number: string | null;
    notes: string | null;
    recorded_by: number;
    created_at: string;
    updated_at: string;
    order?: Order;
    recorded_by_user?: User;
}

export interface Customer {
    id: number;
    tenant_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    full_name?: string;
}

export interface ReceiptsIndexProps {
    receipts: {
        data: Receipt[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        type?: ReceiptType;
    };
    stats: {
        total_receipts: number;
        order_receipts: number;
        payment_receipts: number;
    };
}

export interface ReceiptShowProps {
    receipt: Receipt;
}
