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
    profit?: number;
    margin_percentage?: number;
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
    cogs: number;
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

export interface DashboardPermissions {
    canViewProfits: boolean;
    canViewCosts: boolean;
    canViewFinancials: boolean;
}

export interface DashboardProps {
    metrics: DashboardMetrics;
    shops: Shop[];
    selectedShop: number | null;
    period: 'today' | 'week' | 'month' | 'custom';
    startDate: string | null;
    endDate: string | null;
    permissions: DashboardPermissions;
}

export interface DashboardFilters {
    shop: number | null;
    period: 'today' | 'week' | 'month' | 'custom';
    from?: string;
    to?: string;
}
