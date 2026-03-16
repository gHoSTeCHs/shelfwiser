import { useCallback, useState } from 'react';
import { CartItemCard } from '../components/CartItemCard';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { storefrontFetch } from '../lib/fetch-client';
import type { CartItemData, CartPageData, CartSummaryDetail, FixedPageProps } from '../types/storefront';

const DEFAULT_SUMMARY: CartSummaryDetail = { subtotal: 0, shipping_fee: 0, tax: 0, total: 0, item_count: 0 };

export function CartPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as CartPageData;
    const [items, setItems] = useState<CartItemData[]>(pageData.items ?? []);
    const [summary, setSummary] = useState<CartSummaryDetail>(pageData.summary ?? DEFAULT_SUMMARY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const refreshSummary = useCallback(async () => {
        const result = await storefrontFetch<CartSummaryDetail>(`/store/${shop.slug}/api/cart/summary`);
        if (result.ok) {
            setSummary(result.data);
        } else {
            setError('Could not refresh cart totals. Please reload the page.');
        }
    }, [shop.slug]);

    const handleQuantityChange = useCallback(async (itemId: number, quantity: number) => {
        setLoading(true);
        setError('');
        const result = await storefrontFetch<{ item: CartItemData; message: string }>(`/store/${shop.slug}/api/cart/${itemId}`, {
            method: 'PATCH',
            json: { quantity },
        });

        if (result.ok) {
            if (result.data.item) {
                setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...result.data.item } : item)));
            } else {
                setItems((prev) => prev.filter((item) => item.id !== itemId));
            }
            await refreshSummary();
        } else {
            setError(result.data?.message ?? 'Failed to update cart. Please try again.');
        }
        setLoading(false);
    }, [shop.slug, refreshSummary]);

    const handleRemove = useCallback(async (itemId: number) => {
        setLoading(true);
        setError('');
        const result = await storefrontFetch(`/store/${shop.slug}/api/cart/${itemId}`, {
            method: 'DELETE',
        });

        if (result.ok) {
            setItems((prev) => prev.filter((item) => item.id !== itemId));
            await refreshSummary();
        } else {
            setError('Failed to remove item. Please try again.');
        }
        setLoading(false);
    }, [shop.slug, refreshSummary]);

    if (items.length === 0) {
        return (
            <div
                style={{
                    maxWidth: 'var(--container-width, 1280px)',
                    margin: '0 auto',
                    padding: '80px 24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                }}
            >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128722;</div>
                <h2
                    style={{
                        fontSize: '24px',
                        fontWeight: 600,
                        color: 'var(--color-foreground, #111)',
                        fontFamily: 'var(--font-heading, var(--font-body))',
                        margin: '0 0 8px',
                    }}
                >
                    Your cart is empty
                </h2>
                <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '15px', margin: '0 0 24px' }}>
                    Browse our products and add items to your cart.
                </p>
                <a
                    href={`/store/${shop.slug}/products`}
                    style={{
                        display: 'inline-block',
                        padding: '10px 24px',
                        backgroundColor: 'var(--color-primary, #111)',
                        color: 'var(--color-primary-foreground, #fff)',
                        borderRadius: 'var(--radius, 6px)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '14px',
                    }}
                >
                    Continue Shopping
                </a>
            </div>
        );
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
                Shopping Cart ({summary.item_count} {summary.item_count === 1 ? 'item' : 'items'})
            </h1>

            {error && (
                <div
                    style={{
                        padding: '12px 16px',
                        marginBottom: '16px',
                        backgroundColor: 'var(--color-destructive, #ef4444)',
                        color: '#fff',
                        borderRadius: 'var(--radius, 6px)',
                        fontSize: '14px',
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{ gap: '32px' }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_360px]"
            >
                <div
                    style={{
                        border: '1px solid var(--color-border, #e5e7eb)',
                        borderRadius: 'var(--radius, 6px)',
                        backgroundColor: 'var(--color-surface, #fff)',
                        overflow: 'hidden',
                    }}
                >
                    {items.map((item) => (
                        <CartItemCard
                            key={item.id}
                            item={item}
                            shop={shop}
                            onQuantityChange={handleQuantityChange}
                            onRemove={handleRemove}
                            disabled={loading}
                        />
                    ))}
                </div>

                <div>
                    <OrderSummaryCard summary={summary} shop={shop} />
                    <a
                        href={`/store/${shop.slug}/checkout`}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px 24px',
                            marginTop: '16px',
                            backgroundColor: 'var(--color-primary, #111)',
                            color: 'var(--color-primary-foreground, #fff)',
                            borderRadius: 'var(--radius, 6px)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '15px',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                        }}
                    >
                        Proceed to Checkout
                    </a>
                    <a
                        href={`/store/${shop.slug}/products`}
                        style={{
                            display: 'block',
                            textAlign: 'center',
                            marginTop: '12px',
                            color: 'var(--color-primary, #111)',
                            textDecoration: 'none',
                            fontSize: '14px',
                        }}
                    >
                        Continue Shopping
                    </a>
                </div>
            </div>
        </div>
    );
}
