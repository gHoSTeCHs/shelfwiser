import type { Order } from './order';
import type { Shop } from './shop';

/**
 * Minimal customer interface for search results and quick lookups.
 * Use this when only basic customer info is needed (e.g., POS customer search).
 */
export interface CustomerBasic {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
}

export interface Customer extends CustomerBasic {
    tenant_id: number;
    preferred_shop_id: number | null;
    full_name: string;
    is_active: boolean;
    marketing_opt_in: boolean;
    account_balance: string;
    credit_limit: string | null;
    total_purchases: string;
    last_purchase_at: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;

    preferred_shop?: Shop;
    orders_count?: number;
    addresses_count?: number;
    orders?: Order[];
    addresses?: CustomerAddress[];
}

export interface CustomerStatistics {
    total_customers: number;
    active_customers: number;
    customers_with_credit: number;
    total_credit_balance: string;
    new_this_month: number;
}

export interface CustomerAddress {
    id: number;
    customer_id: number;
    tenant_id: number;
    label: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface CustomerAddressFormData {
    street: string;
    city: string;
    state: string;
    postal_code: string;
}

export interface CreateCustomerFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    address: CustomerAddressFormData;
    preferred_shop_id: number | null;
    is_active: boolean;
    marketing_opt_in: boolean;
    credit_limit: string;
}

export interface UpdateCustomerFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: CustomerAddressFormData;
    preferred_shop_id: number | null;
    is_active: boolean;
    marketing_opt_in: boolean;
    credit_limit: string;
}

export interface GeneratedCustomerData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    address: CustomerAddressFormData;
    is_active: boolean;
    marketing_opt_in: boolean;
    credit_limit: null;
}

export interface CustomerFilters {
    search?: string;
    status?: 'active' | 'inactive' | '';
    has_credit?: 'yes' | 'no' | '';
    shop_id?: number | '';
    sort?: string;
    direction?: 'asc' | 'desc';
}

export interface CustomerIndexPageProps {
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    statistics: CustomerStatistics;
    shops: Array<{ id: number; name: string; slug: string }>;
    filters: CustomerFilters;
}

export interface CustomerShowPageProps {
    customer: Customer;
    recentOrders: Order[];
    canManageCredit: boolean;
}

export interface CustomerCreatePageProps {
    shops: Array<{ id: number; name: string; slug: string }>;
}

export interface CustomerEditPageProps {
    customer: Customer;
    shops: Array<{ id: number; name: string; slug: string }>;
}

export const DEFAULT_CREATE_CUSTOMER_FORM_DATA: CreateCustomerFormData = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
    },
    preferred_shop_id: null,
    is_active: true,
    marketing_opt_in: false,
    credit_limit: '',
};

export const DEFAULT_UPDATE_CUSTOMER_FORM_DATA: UpdateCustomerFormData = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
    },
    preferred_shop_id: null,
    is_active: true,
    marketing_opt_in: false,
    credit_limit: '',
};

export { formatCurrency } from '@/lib/formatters';

export function getAvailableCredit(customer: Customer): number | null {
    if (!customer.credit_limit) return null;
    const limit = parseFloat(customer.credit_limit);
    const balance = parseFloat(customer.account_balance);
    return Math.max(0, limit - balance);
}
