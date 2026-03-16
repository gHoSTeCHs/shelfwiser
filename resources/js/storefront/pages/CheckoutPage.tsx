import { useEffect, useState } from 'react';
import { AddressForm } from '../components/AddressForm';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { storefrontFetch } from '../lib/fetch-client';
import { formatCurrency } from '../lib/formatters';
import type { CartSummaryDetail, CheckoutPageData, FixedPageProps, ShippingAddress } from '../types/storefront';

const EMPTY_ADDRESS: ShippingAddress = {
    first_name: '',
    last_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'NG',
};

const DEFAULT_SUMMARY: CartSummaryDetail = { subtotal: 0, shipping_fee: 0, tax: 0, total: 0, item_count: 0 };

const PAYMENT_LABELS: Record<string, string> = {
    paystack: 'Pay with Paystack',
    cash_on_delivery: 'Pay on Delivery',
    bank_transfer: 'Bank Transfer',
};

function isSafeRedirect(url: string): boolean {
    return (url.startsWith('/') && !url.startsWith('//')) || url.startsWith(window.location.origin + '/');
}

export function CheckoutPage({ data, shop, customer }: FixedPageProps) {
    const pageData = data as unknown as CheckoutPageData;
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
    const [paymentMethod, setPaymentMethod] = useState(pageData.payment_methods?.[0] ?? 'cash_on_delivery');
    const [customerNotes, setCustomerNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [generalError, setGeneralError] = useState('');
    const summary = pageData.summary ?? DEFAULT_SUMMARY;

    const isEmpty = !pageData.items || pageData.items.length === 0;

    useEffect(() => {
        if (isEmpty) {
            window.location.href = `/store/${shop.slug}/cart`;
        }
    }, [isEmpty, shop.slug]);

    if (isEmpty) {
        return null;
    }

    if (!customer) {
        const redirectTarget = encodeURIComponent(`/store/${shop.slug}/checkout`);
        return (
            <div
                style={{
                    maxWidth: '480px',
                    margin: '0 auto',
                    padding: '80px 24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                }}
            >
                <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-foreground, #111)', margin: '0 0 12px' }}>
                    Please sign in to checkout
                </h2>
                <p style={{ color: 'var(--color-muted-foreground, #6b7280)', margin: '0 0 24px' }}>
                    You need an account to complete your purchase.
                </p>
                <a
                    href={`/store/${shop.slug}/login?redirect=${redirectTarget}`}
                    style={{
                        display: 'inline-block',
                        padding: '10px 24px',
                        backgroundColor: 'var(--color-primary, #111)',
                        color: 'var(--color-primary-foreground, #fff)',
                        borderRadius: 'var(--radius, 6px)',
                        textDecoration: 'none',
                        fontWeight: 500,
                    }}
                >
                    Sign In
                </a>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setGeneralError('');

        const result = await storefrontFetch<{
            order: { id: number; order_number: string };
            redirect_url: string;
            requires_payment: boolean;
            message: string;
        }>(`/store/${shop.slug}/api/checkout`, {
            method: 'POST',
            json: {
                shipping_address: shippingAddress,
                billing_same_as_shipping: true,
                payment_method: paymentMethod,
                customer_notes: customerNotes || undefined,
            },
        });

        if (result.ok) {
            const url = result.data.redirect_url;
            if (isSafeRedirect(url)) {
                window.location.href = url;
            } else {
                setGeneralError('Invalid redirect after payment. Please check your orders.');
                setProcessing(false);
            }
            return;
        }

        if (result.errors) {
            setErrors(result.errors);
        } else {
            setGeneralError(result.data?.message ?? 'Something went wrong. Please try again.');
        }
        setProcessing(false);
    }

    return (
        <div
            style={{
                maxWidth: 'var(--container-width, 1280px)',
                margin: '0 auto',
                padding: 'var(--section-spacing, 64px) 24px',
                fontFamily: 'var(--font-body)',
            }}
        >
            <h1
                style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--color-foreground, #111)',
                    fontFamily: 'var(--font-heading, var(--font-body))',
                    margin: '0 0 32px',
                }}
            >
                Checkout
            </h1>

            {generalError && (
                <div
                    style={{
                        padding: '12px 16px',
                        marginBottom: '24px',
                        backgroundColor: 'var(--color-destructive, #ef4444)',
                        color: '#fff',
                        borderRadius: 'var(--radius, 6px)',
                        fontSize: '14px',
                    }}
                >
                    {generalError}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-foreground, #111)', margin: '0 0 16px' }}>
                                Shipping Address
                            </h2>
                            <AddressForm
                                address={shippingAddress}
                                onChange={setShippingAddress}
                                errors={errors}
                                disabled={processing}
                            />
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-foreground, #111)', margin: '0 0 16px' }}>
                                Payment Method
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {pageData.payment_methods.map((method) => (
                                    <label
                                        key={method}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            border: `2px solid ${paymentMethod === method ? 'var(--color-primary, #111)' : 'var(--color-border, #e5e7eb)'}`,
                                            borderRadius: 'var(--radius, 6px)',
                                            cursor: 'pointer',
                                            backgroundColor: 'var(--color-surface, #fff)',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={method}
                                            checked={paymentMethod === method}
                                            onChange={() => setPaymentMethod(method)}
                                            disabled={processing}
                                        />
                                        <span style={{ fontSize: '14px', color: 'var(--color-foreground, #111)' }}>
                                            {PAYMENT_LABELS[method] ?? method}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {errors.payment_method && (
                                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-destructive, #ef4444)' }}>
                                    {errors.payment_method[0]}
                                </p>
                            )}
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-foreground, #111)', margin: '0 0 8px' }}>
                                Order Notes
                            </h2>
                            <textarea
                                value={customerNotes}
                                onChange={(e) => setCustomerNotes(e.target.value)}
                                placeholder="Any special instructions for your order..."
                                disabled={processing}
                                maxLength={500}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    borderRadius: 'var(--radius, 6px)',
                                    backgroundColor: 'var(--color-surface, #fff)',
                                    color: 'var(--color-foreground, #111)',
                                    fontFamily: 'var(--font-body)',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </section>
                    </div>

                    <div>
                        <div style={{ position: 'sticky', top: '24px' }}>
                            <OrderSummaryCard summary={summary} shop={shop} />

                            <div
                                style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    borderRadius: 'var(--radius, 6px)',
                                    backgroundColor: 'var(--color-surface, #fff)',
                                }}
                            >
                                <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground, #111)' }}>
                                    Items ({summary.item_count})
                                </h4>
                                {pageData.items.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '13px',
                                            padding: '4px 0',
                                            color: 'var(--color-muted-foreground, #6b7280)',
                                        }}
                                    >
                                        <span>{item.name} &times; {item.quantity}</span>
                                        <span>{formatCurrency(item.price * item.quantity, shop.currency_symbol, shop.currency_decimals)}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '14px 24px',
                                    marginTop: '16px',
                                    backgroundColor: processing ? 'var(--color-muted, #9ca3af)' : 'var(--color-primary, #111)',
                                    color: 'var(--color-primary-foreground, #fff)',
                                    border: 'none',
                                    borderRadius: 'var(--radius, 6px)',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--font-body)',
                                }}
                            >
                                {processing ? 'Processing...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
