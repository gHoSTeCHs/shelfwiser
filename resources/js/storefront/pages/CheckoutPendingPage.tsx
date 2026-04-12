import { AuthGatePrompt } from '../components/AuthGatePrompt';
import type { FixedPageProps, OrderPageData } from '../types/storefront';

export function CheckoutPendingPage({ data, shop, customer }: FixedPageProps) {
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

    return (
        <div
            style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: 'var(--section-spacing, 64px) 24px',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
            }}
        >
            <div
                style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: '#fff',
                }}
            >
                &#8987;
            </div>

            <h1
                style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--color-foreground, #111)',
                    fontFamily: 'var(--font-heading, var(--font-body))',
                    margin: '0 0 12px',
                }}
            >
                Payment Being Verified
            </h1>

            <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '15px', margin: '0 0 8px', lineHeight: 1.6 }}>
                Your payment is being processed and verified. This usually takes a few moments.
            </p>

            <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: '0 0 32px' }}>
                Order Number: <strong style={{ color: 'var(--color-foreground, #111)' }}>{order.order_number}</strong>
            </p>

            <div
                style={{
                    padding: '24px',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 'var(--radius, 6px)',
                    backgroundColor: 'var(--color-surface, #fff)',
                    marginBottom: '32px',
                    textAlign: 'left',
                }}
            >
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>
                    What happens next?
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', lineHeight: 1.8 }}>
                    <li>We will verify your payment with the payment provider.</li>
                    <li>Once confirmed, your order status will be updated.</li>
                    <li>You will receive an email confirmation once the payment is verified.</li>
                </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                    View My Orders
                </a>
                <a
                    href={`/store/${shop.slug}`}
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
                    Back to Shop
                </a>
            </div>
        </div>
    );
}
