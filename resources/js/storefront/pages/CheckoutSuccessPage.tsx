import { AuthGatePrompt } from '../components/AuthGatePrompt';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../lib/formatters';
import type { FixedPageProps, OrderPageData } from '../types/storefront';

export function CheckoutSuccessPage({ data, shop, customer }: FixedPageProps) {
    if (!customer) {
        return <AuthGatePrompt shop={shop} />;
    }

    const pageData = data as unknown as OrderPageData;
    const order = pageData.order;

    if (!order) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
                <h2 style={{ color: 'var(--color-foreground, #111)' }}>Order not found</h2>
            </div>
        );
    }

    const fmt = (amount: number) => formatCurrency(amount, shop.currency_symbol, shop.currency_decimals);

    return (
        <div
            style={{
                maxWidth: '720px',
                margin: '0 auto',
                padding: 'var(--section-spacing, 64px) 24px',
                fontFamily: 'var(--font-body)',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 16px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        color: '#fff',
                    }}
                >
                    &#10003;
                </div>
                <h1
                    style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: 'var(--color-foreground, #111)',
                        fontFamily: 'var(--font-heading, var(--font-body))',
                        margin: '0 0 8px',
                    }}
                >
                    Order Confirmed!
                </h1>
                <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '15px', margin: 0 }}>
                    Thank you for your purchase. Your order has been placed successfully.
                </p>
            </div>

            <div
                style={{
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 'var(--radius, 6px)',
                    backgroundColor: 'var(--color-surface, #fff)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)' }}>Order Number</p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-foreground, #111)' }}>
                                {order.order_number}
                            </p>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>Items</h3>
                    {order.items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 0',
                                borderBottom: '1px solid var(--color-border, #e5e7eb)',
                                fontSize: '14px',
                            }}
                        >
                            <div>
                                <span style={{ color: 'var(--color-foreground, #111)' }}>{item.name}</span>
                                {item.variant_name && (
                                    <span style={{ color: 'var(--color-muted-foreground, #6b7280)', marginLeft: '4px' }}>
                                        ({item.variant_name})
                                    </span>
                                )}
                                <span style={{ color: 'var(--color-muted-foreground, #6b7280)', marginLeft: '8px' }}>
                                    &times; {item.quantity}
                                </span>
                            </div>
                            <span style={{ fontWeight: 500, color: 'var(--color-foreground, #111)' }}>{fmt(item.total)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-muted, #f9fafb)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <TotalRow label="Subtotal" value={fmt(order.subtotal)} />
                        {order.tax > 0 && <TotalRow label="Tax" value={fmt(order.tax)} />}
                        <TotalRow label="Total" value={fmt(order.total)} bold />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
                <a
                    href={`/store/${shop.slug}/account/orders`}
                    style={{
                        padding: '10px 24px',
                        border: '1px solid var(--color-border, #e5e7eb)',
                        borderRadius: 'var(--radius, 6px)',
                        color: 'var(--color-foreground, #111)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                >
                    View All Orders
                </a>
                <a
                    href={`/store/${shop.slug}/products`}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: 'var(--color-primary, #111)',
                        color: 'var(--color-primary-foreground, #fff)',
                        borderRadius: 'var(--radius, 6px)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                >
                    Continue Shopping
                </a>
            </div>
        </div>
    );
}


function TotalRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: bold ? '16px' : '14px',
                fontWeight: bold ? 700 : 400,
                color: bold ? 'var(--color-foreground, #111)' : 'var(--color-muted-foreground, #6b7280)',
            }}
        >
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
