import { AccountLayout } from './AccountLayout';
import { AuthGatePrompt } from '../../components/AuthGatePrompt';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency } from '../../lib/formatters';
import type { AccountDashboardPageData, FixedPageProps, OrderData } from '../../types/storefront';

const DEFAULT_STATS = { total_orders: 0, total_spent: 0 };

export function DashboardPage({ data, shop, customer }: FixedPageProps) {
    if (!customer) {
        return <AuthGatePrompt shop={shop} />;
    }

    const pageData = data as unknown as AccountDashboardPageData;
    const stats = pageData.stats ?? DEFAULT_STATS;
    const recentOrders = pageData.recent_orders ?? [];

    return (
        <AccountLayout shop={shop} activeItem="dashboard">
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 24px' }}>
                Welcome back, {customer.name}
            </h1>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard label="Total Orders" value={String(stats.total_orders)} />
                <StatCard label="Total Spent" value={formatCurrency(stats.total_spent, shop.currency_symbol, shop.currency_decimals)} />
            </div>

            <div style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-foreground, #111)', margin: 0 }}>Recent Orders</h2>
                    {recentOrders.length > 0 && (
                        <a href={`/store/${shop.slug}/account/orders`} style={{ fontSize: '13px', color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500 }}>
                            View all
                        </a>
                    )}
                </div>

                {recentOrders.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}>
                        <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: '0 0 16px' }}>You haven&apos;t placed any orders yet.</p>
                        <a href={`/store/${shop.slug}/products`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
                            Start shopping
                        </a>
                    </div>
                ) : (
                    <div style={{ border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)', overflow: 'hidden' }}>
                        {recentOrders.map((order) => (
                            <OrderRow key={order.id} order={order} shop={shop} />
                        ))}
                    </div>
                )}
            </div>
        </AccountLayout>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '24px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)', margin: '0 0 8px', fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-foreground, #111)', margin: 0, fontFamily: 'var(--font-heading, var(--font-body))' }}>{value}</p>
        </div>
    );
}

function OrderRow({ order, shop }: { order: OrderData; shop: FixedPageProps['shop'] }) {
    const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    return (
        <a
            href={`/store/${shop.slug}/account/orders/${order.id}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border, #e5e7eb)', textDecoration: 'none', gap: '12px', flexWrap: 'wrap' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>{order.order_number}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)' }}>{date}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <StatusBadge status={order.status} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>
                    {formatCurrency(order.total, shop.currency_symbol, shop.currency_decimals)}
                </span>
            </div>
        </a>
    );
}
