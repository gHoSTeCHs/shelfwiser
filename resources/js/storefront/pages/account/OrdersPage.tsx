import { AccountLayout } from './AccountLayout';
import { AuthGatePrompt } from '../../components/AuthGatePrompt';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency } from '../../lib/formatters';
import type { AccountOrdersPageData, FixedPageProps, OrderData } from '../../types/storefront';

const DEFAULT_META = { current_page: 1, last_page: 1, per_page: 10, total: 0 };

export function OrdersPage({ data, shop, customer }: FixedPageProps) {
    if (!customer) {
        return <AuthGatePrompt shop={shop} />;
    }

    const pageData = data as unknown as AccountOrdersPageData;
    const orders = pageData.orders?.data ?? [];
    const meta = pageData.orders?.meta ?? DEFAULT_META;

    return (
        <AccountLayout shop={shop} activeItem="orders">
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 24px' }}>
                My Orders
            </h1>

            {orders.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}>
                    <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '15px', margin: '0 0 16px' }}>No orders found.</p>
                    <a href={`/store/${shop.slug}/products`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>Browse products</a>
                </div>
            ) : (
                <>
                    <div style={{ border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border, #e5e7eb)', backgroundColor: 'var(--color-muted, #f9fafb)' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-foreground, #111)', fontSize: '13px' }}>Order</th>
                                    <th className="hidden sm:table-cell" style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-foreground, #111)', fontSize: '13px' }}>Date</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-foreground, #111)', fontSize: '13px' }}>Status</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-foreground, #111)', fontSize: '13px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderTableRow key={order.id} order={order} shop={shop} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {meta.last_page > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
                            {meta.current_page > 1 && (
                                <a
                                    href={`/store/${shop.slug}/account/orders?page=${meta.current_page - 1}`}
                                    style={{ padding: '8px 16px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', color: 'var(--color-foreground, #111)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
                                >
                                    Previous
                                </a>
                            )}
                            <span style={{ fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                            {meta.current_page < meta.last_page && (
                                <a
                                    href={`/store/${shop.slug}/account/orders?page=${meta.current_page + 1}`}
                                    style={{ padding: '8px 16px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', color: 'var(--color-foreground, #111)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
                                >
                                    Next
                                </a>
                            )}
                        </div>
                    )}
                </>
            )}
        </AccountLayout>
    );
}

function OrderTableRow({ order, shop }: { order: OrderData; shop: FixedPageProps['shop'] }) {
    const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    return (
        <tr style={{ borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
            <td style={{ padding: '14px 16px' }}>
                <a href={`/store/${shop.slug}/account/orders/${order.id}`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 600 }}>
                    {order.order_number}
                </a>
            </td>
            <td className="hidden sm:table-cell" style={{ padding: '14px 16px', color: 'var(--color-muted-foreground, #6b7280)' }}>{date}</td>
            <td style={{ padding: '14px 16px' }}>
                <StatusBadge status={order.status} />
            </td>
            <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>
                {formatCurrency(order.total, shop.currency_symbol, shop.currency_decimals)}
            </td>
        </tr>
    );
}
