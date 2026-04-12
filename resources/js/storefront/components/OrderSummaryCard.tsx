import { formatCurrency } from '../lib/formatters';
import type { CartSummaryDetail, ShopData } from '../types/storefront';

interface OrderSummaryCardProps {
    summary: CartSummaryDetail;
    shop: ShopData;
}

export function OrderSummaryCard({ summary, shop }: OrderSummaryCardProps) {
    const fmt = (amount: number) => formatCurrency(amount, shop.currency_symbol, shop.currency_decimals);

    return (
        <div
            style={{
                padding: '24px',
                borderRadius: 'var(--radius, 6px)',
                border: '1px solid var(--color-border, #e5e7eb)',
                backgroundColor: 'var(--color-surface, #fff)',
                fontFamily: 'var(--font-body)',
            }}
        >
            <h3
                style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-foreground, #111)',
                    fontFamily: 'var(--font-heading, var(--font-body))',
                }}
            >
                Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SummaryRow label="Subtotal" value={fmt(summary.subtotal)} />
                {summary.shipping_fee > 0 && <SummaryRow label="Shipping" value={fmt(summary.shipping_fee)} />}
                {summary.shipping_fee === 0 && <SummaryRow label="Shipping" value="Free" />}
                {summary.tax > 0 && <SummaryRow label="Tax" value={fmt(summary.tax)} />}
                <div
                    style={{
                        borderTop: '1px solid var(--color-border, #e5e7eb)',
                        paddingTop: '8px',
                        marginTop: '4px',
                    }}
                >
                    <SummaryRow label="Total" value={fmt(summary.total)} bold />
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
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
