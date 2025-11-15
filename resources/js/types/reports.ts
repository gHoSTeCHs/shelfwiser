import { PaginationMeta, Shop } from './index';
import { Product } from './product';
import { ProductCategory } from './productCategory';

// Sales Report Types
export interface SalesSummary {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    total_discounts: number;
    total_tax: number;
    paid_orders: number;
    payment_rate: number;
}

export interface SalesByOrder {
    id: number;
    order_number: string;
    customer: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    } | null;
    shop: {
        id: number;
        name: string;
    };
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
}

export interface SalesByProduct {
    product_variant_id: number;
    order_count: number;
    total_quantity: number;
    total_revenue: number;
    avg_price: number;
    product_variant: {
        id: number;
        name: string;
        sku: string;
        product: {
            id: number;
            name: string;
            category?: ProductCategory;
        };
    };
}

export interface SalesByCustomer {
    customer_id: number;
    order_count: number;
    total_revenue: number;
    avg_order_value: number;
    paid_orders: number;
    last_order_date: string;
    customer: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export interface SalesByShop {
    shop_id: number;
    order_count: number;
    total_revenue: number;
    total_discounts: number;
    avg_order_value: number;
    shop: {
        id: number;
        name: string;
    };
}

export interface SalesByDay {
    sale_date: string;
    order_count: number;
    total_revenue: number;
    avg_order_value: number;
    total_discounts: number;
}

export interface SalesReportData {
    data: (
        | SalesByOrder
        | SalesByProduct
        | SalesByCustomer
        | SalesByShop
        | SalesByDay
    )[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface SalesReportProps {
    summary: SalesSummary;
    salesData: SalesReportData;
    shops: Shop[];
    categories: ProductCategory[];
    filters: {
        shop: number | null;
        from: string;
        to: string;
        category: number | null;
        product: number | null;
        customer: number | null;
        status: string | null;
        payment_status: string | null;
        group_by: 'order' | 'product' | 'customer' | 'shop' | 'day';
    };
    orderStatuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
    canViewCosts: boolean;
    canViewProfits: boolean;
}

// Inventory Report Types
export interface InventorySummary {
    total_products: number;
    total_variants: number;
    total_value: number;
    low_stock_count: number;
}

export interface InventoryItem {
    id: number;
    sku: string;
    name: string;
    cost_price: number | null;
    reorder_level: number | null;
    is_active: boolean;
    product: {
        id: number;
        name: string;
        shop: {
            id: number;
            name: string;
        };
        category?: ProductCategory;
    };
    inventory_locations: Array<{
        id: number;
        quantity: number;
        location_id: number;
        location_type: string;
    }>;
}

export interface InventoryReportData {
    data: InventoryItem[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface InventoryReportProps {
    summary: InventorySummary;
    inventoryData: InventoryReportData;
    shops: Shop[];
    categories: ProductCategory[];
    filters: {
        shop: number | null;
        category: number | null;
        product: number | null;
        stock_status: 'low' | 'adequate' | 'overstocked' | null;
    };
    canViewCosts: boolean;
}

// Supplier Report Types
export interface SupplierPerformance {
    supplier_tenant_id: number;
    po_count: number;
    total_spend: number;
    avg_po_value: number;
    completed_count: number;
    paid_count: number;
    avg_lead_time: number;
    supplier_tenant: {
        id: number;
        name: string;
    };
}

export interface SupplierPurchaseOrder {
    id: number;
    po_number: string;
    supplier_tenant: {
        id: number;
        name: string;
    };
    shop: {
        id: number;
        name: string;
    };
    total_amount: number;
    paid_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    expected_delivery_date: string | null;
}

export interface SupplierReportData {
    data: SupplierPurchaseOrder[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface SupplierReportProps {
    performanceSummary: SupplierPerformance[];
    supplierData: SupplierReportData;
    shops: Shop[];
    filters: {
        shop: number | null;
        from: string;
        to: string;
        supplier: number | null;
        status: string | null;
        payment_status: string | null;
    };
    poStatuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
    canViewCosts: boolean;
}

// Financial Report Types
export interface ProfitLossStatement {
    gross_sales: number;
    discounts: number;
    net_sales: number;
    cogs: number;
    gross_profit: number;
    gross_margin: number;
    operating_expenses: number;
    net_profit: number;
    net_margin: number;
}

export interface CashFlowStatement {
    cash_inflow: number;
    cash_outflow: number;
    net_cash_flow: number;
}

export interface BalanceSheet {
    assets: {
        inventory: number;
        accounts_receivable: number;
        total_current_assets: number;
    };
    liabilities: {
        accounts_payable: number;
        total_current_liabilities: number;
    };
    working_capital: number;
}

export interface FinancialReportData {
    profit_loss: ProfitLossStatement;
    cash_flow: CashFlowStatement;
    balance_sheet: BalanceSheet;
}

export interface FinancialReportProps {
    financialData: FinancialReportData;
    shops: Shop[];
    filters: {
        shop: number | null;
        from: string;
        to: string;
    };
}

// Common Filter Types
export interface ReportFilters {
    shop?: number | null;
    from?: string;
    to?: string;
    category?: number | null;
    product?: number | null;
    customer?: number | null;
    supplier?: number | null;
    status?: string | null;
    payment_status?: string | null;
    stock_status?: 'low' | 'adequate' | 'overstocked' | null;
    group_by?: 'order' | 'product' | 'customer' | 'shop' | 'day';
    per_page?: number;
}
