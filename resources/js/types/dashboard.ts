import { Shop } from './shop';

export interface SalesMetrics {
    total_revenue: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    shipping_cost: number;
    avg_order_value: number;
    trend: number;
}

export interface OrderMetrics {
    total_count: number;
    pending_count: number;
    confirmed_count: number;
    processing_count: number;
    delivered_count: number;
    cancelled_count: number;
    paid_count: number;
    unpaid_count: number;
}

export interface TopProduct {
    id: number;
    name: string;
    variant_name: string;
    sku: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
}

export interface RecentOrder {
    id: number;
    order_number: string;
    customer_name: string;
    shop_name: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
}

export interface LowStockAlert {
    id: number;
    product_name: string;
    variant_name: string;
    sku: string;
    current_stock: number;
    reorder_level: number;
    deficit: number;
}

export interface ChartData {
    labels: string[];
    data: number[];
}

export interface ProfitMetrics {
    profit: number;
    margin: number;
    revenue: number;
    cogs?: number;
}

export interface DashboardMetrics {
    sales: SalesMetrics;
    orders: OrderMetrics;
    top_products: TopProduct[];
    recent_orders: RecentOrder[];
    low_stock: LowStockAlert[];
    chart_data: ChartData;
    inventory_valuation?: number;
    profit?: ProfitMetrics;
}

// NEW: Supplier Tab Types
export interface SupplierSummary {
    total_suppliers: number;
    active_pos: number;
    pending_payments: number;
    overdue_payments: number;
    total_spend: number;
}

export interface TopSupplier {
    supplier_id: number;
    supplier_name: string;
    po_count: number;
    total_spend: number;
    avg_order_value: number;
}

export interface RecentPurchaseOrder {
    id: number;
    po_number: string;
    supplier_name: string;
    shop_name: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
}

export interface StatusBreakdown {
    [key: string]: {
        count: number;
        total: number;
        label: string;
        color: string;
    };
}

export interface SupplierData {
    summary: SupplierSummary;
    top_suppliers: TopSupplier[];
    recent_pos: RecentPurchaseOrder[];
    payment_status_breakdown: StatusBreakdown;
    po_status_breakdown: StatusBreakdown;
}

// NEW: Sales Tab Types
export interface SalesTabSummary {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    total_discounts: number;
}

export interface RevenueByShop {
    shop_id: number;
    shop_name: string;
    revenue: number;
    order_count: number;
}

export interface SalesData {
    summary: SalesTabSummary;
    revenue_by_shop: RevenueByShop[];
    revenue_trend: ChartData;
    top_products: TopProduct[];
    orders_by_status: StatusBreakdown;
}

// NEW: Inventory Tab Types
export interface InventorySummary {
    total_products: number;
    total_variants: number;
    total_value: number;
    low_stock_count: number;
}

export interface StockMovement {
    id: number;
    reference_number: string;
    product_name: string;
    variant_name: string;
    type: string;
    quantity: number;
    shop_name: string;
    performed_by: string;
    created_at: string;
}

export interface ValuationByShop {
    shop_id: number;
    shop_name: string;
    valuation: number;
}

export interface InventoryData {
    summary: InventorySummary;
    low_stock: LowStockAlert[];
    stock_movements: StockMovement[];
    valuation_by_shop: ValuationByShop[];
}

// UPDATED: Dashboard Props with Tab Support
export interface DashboardProps {
    activeTab: 'overview' | 'sales' | 'inventory' | 'suppliers';
    data: DashboardMetrics | SupplierData | SalesData | InventoryData;
    shops: Shop[];
    selectedShop: number | null;
    period: 'today' | 'week' | 'month' | 'custom';
    startDate: string | null;
    endDate: string | null;
    can_view_financials: boolean;
}
