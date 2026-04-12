import { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { AuthGatePrompt } from '../../components/AuthGatePrompt';
import { StatusBadge } from '../../components/StatusBadge';
import { storefrontFetch } from '../../lib/fetch-client';
import { formatCurrency } from '../../lib/formatters';
import type { AccountOrderDetailPageData, FixedPageProps, OrderData } from '../../types/storefront';

export function OrderDetailPage({ data, shop, customer }: FixedPageProps) {
    if (!customer) {
        return <AuthGatePrompt shop={shop} />;
    }

    const pageData = data as unknown as AccountOrderDetailPageData;
    const order = pageData.order;

    if (!order) {
        return (
            <AccountLayout shop={shop} activeItem="orders">
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '20px', color: 'var(--color-foreground, #111)' }}>Order not found</h2>
                    <a href={`/store/${shop.slug}/account/orders`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Back to orders</a>
                </div>
            </AccountLayout>
        );
    }

    return (
        <AccountLayout shop={shop} activeItem="orders">
            <OrderDetailContent order={order} shop={shop} />
        </AccountLayout>
    );
}

function OrderDetailContent({ order, shop }: { order: OrderData; shop: FixedPageProps['shop'] }) {
    const [cancelling, setCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const fmt = (amount: number) => formatCurrency(amount, shop.currency_symbol, shop.currency_decimals);
    const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';
    const canCancel = ['pending', 'confirmed'].includes(order.status);

    async function handleCancel(e: React.FormEvent) {
        e.preventDefault();
        setCancelling(true);
        setCancelError('');

        const result = await storefrontFetch<{ message: string }>(
            `/store/${shop.slug}/api/account/orders/${order.id}/cancel`,
            { method: 'POST', json: { cancellation_reason: cancelReason } },
        );

        if (result.ok) {
            window.location.reload();
            return;
        }

        setCancelError(result.data?.message ?? 'Failed to cancel order.');
        setCancelling(false);
    }

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <a href={`/store/${shop.slug}/account/orders`} style={{ color: 'var(--color-muted-foreground, #6b7280)', textDecoration: 'none', fontSize: '13px' }}>
                    &larr; Back to orders
                </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 4px' }}>
                        Order {order.order_number}
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)', margin: 0 }}>{date}</p>
                </div>
                <StatusBadge status={order.status} />
            </div>

            <div style={{ border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border, #e5e7eb)', backgroundColor: 'var(--color-muted, #f9fafb)' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>Items</h3>
                </div>
                {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border, #e5e7eb)', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            {item.image && <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius, 6px)', flexShrink: 0 }} />}
                            <div>
                                <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 500, color: 'var(--color-foreground, #111)' }}>{item.name}</p>
                                {item.variant_name && <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted-foreground, #6b7280)' }}>{item.variant_name}</p>}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-foreground, #111)', fontWeight: 500 }}>{fmt(item.total)}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted-foreground, #6b7280)' }}>{fmt(item.unit_price)} &times; {item.quantity}</p>
                        </div>
                    </div>
                ))}
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-muted, #f9fafb)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)', marginBottom: '4px' }}>
                        <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
                    </div>
                    {order.tax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)', marginBottom: '4px' }}>
                            <span>Tax</span><span>{fmt(order.tax)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--color-foreground, #111)', paddingTop: '8px', borderTop: '1px solid var(--color-border, #e5e7eb)' }}>
                        <span>Total</span><span>{fmt(order.total)}</span>
                    </div>
                </div>
            </div>

            {order.payments.length > 0 && (
                <div style={{ border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border, #e5e7eb)', backgroundColor: 'var(--color-muted, #f9fafb)' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>Payments</h3>
                    </div>
                    {order.payments.map((payment) => (
                        <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--color-border, #e5e7eb)', fontSize: '14px' }}>
                            <span style={{ color: 'var(--color-foreground, #111)', textTransform: 'capitalize' }}>{payment.method.replace(/_/g, ' ')}</span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-muted-foreground, #6b7280)', textTransform: 'capitalize' }}>{payment.status}</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-foreground, #111)' }}>{fmt(payment.amount)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {canCancel && (
                <div style={{ border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)', padding: '20px' }}>
                    {!showCancelForm ? (
                        <button
                            type="button"
                            onClick={() => setShowCancelForm(true)}
                            style={{ padding: '8px 20px', border: '1px solid var(--color-destructive, #ef4444)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'transparent', color: 'var(--color-destructive, #ef4444)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                        >
                            Cancel Order
                        </button>
                    ) : (
                        <form onSubmit={handleCancel}>
                            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>Cancel this order?</p>
                            {cancelError && <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-destructive, #ef4444)' }}>{cancelError}</p>}
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation (optional)"
                                maxLength={500}
                                rows={3}
                                disabled={cancelling}
                                style={{
                                    width: '100%', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box',
                                    border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)',
                                    backgroundColor: 'var(--color-surface, #fff)', color: 'var(--color-foreground, #111)',
                                    fontFamily: 'var(--font-body)', resize: 'vertical', marginBottom: '12px',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="submit"
                                    disabled={cancelling}
                                    style={{
                                        padding: '8px 20px', border: 'none', borderRadius: 'var(--radius, 6px)',
                                        backgroundColor: cancelling ? 'var(--color-muted, #9ca3af)' : 'var(--color-destructive, #ef4444)',
                                        color: '#fff', fontSize: '14px', fontWeight: 500, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCancelForm(false); setCancelError(''); }}
                                    disabled={cancelling}
                                    style={{ padding: '8px 20px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)', color: 'var(--color-foreground, #111)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                                >
                                    Keep Order
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </>
    );
}

