import { useEffect, useState } from 'react';
import { formatCurrency } from '../lib/formatters';
import { useCartStore } from '../stores/cart-store';
import type { ShopData } from '../types/storefront';

interface CartDrawerProps {
    shop: ShopData;
}

export function CartDrawer({ shop }: CartDrawerProps) {
    const { items, summary, isOpen, isLoading, closeDrawer, updateItem, removeItem } = useCartStore();
    const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    async function handleUpdate(itemId: number, quantity: number) {
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        await updateItem(itemId, quantity);
        setUpdatingItems((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
        });
    }

    async function handleRemove(itemId: number) {
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        await removeItem(itemId);
        setUpdatingItems((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
        });
    }

    return (
        <>
            <div
                className="fixed inset-0 z-[80] transition-opacity duration-300"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                }}
                onClick={closeDrawer}
            />

            <div
                className="fixed top-0 right-0 bottom-0 z-[90] flex w-full max-w-md flex-col"
                style={{
                    backgroundColor: 'var(--color-background, #fff)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    fontFamily: 'var(--font-body, sans-serif)',
                    boxShadow: isOpen ? '-8px 0 32px rgba(0,0,0,0.12)' : 'none',
                }}
            >
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid var(--color-border, #e5e5e5)' }}
                >
                    <h2
                        className="text-lg font-semibold"
                        style={{ color: 'var(--color-foreground, #1a1a1a)', fontFamily: 'var(--font-heading, sans-serif)' }}
                    >
                        Cart ({summary.item_count})
                    </h2>
                    <button
                        onClick={closeDrawer}
                        className="flex h-8 w-8 items-center justify-center"
                        style={{ color: 'var(--color-text-muted, #888)' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoading && items.length === 0 && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="h-20 w-20 shrink-0" style={{ backgroundColor: 'var(--color-surface, #f0f0f0)', borderRadius: 'var(--radius, 8px)' }} />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 w-3/4" style={{ backgroundColor: 'var(--color-surface, #f0f0f0)', borderRadius: '4px' }} />
                                        <div className="h-3 w-1/2" style={{ backgroundColor: 'var(--color-surface, #f0f0f0)', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted, #ccc)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted, #888)' }}>
                                Your cart is empty
                            </p>
                            <a
                                href={`/store/${shop.slug}/products`}
                                className="mt-4 px-6 py-2 text-sm font-medium text-white"
                                style={{
                                    backgroundColor: 'var(--color-primary, #1a1a1a)',
                                    borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                }}
                                onClick={closeDrawer}
                            >
                                Continue Shopping
                            </a>
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 transition-opacity"
                                    style={{ opacity: updatingItems.has(item.id) ? 0.5 : 1 }}
                                >
                                    <div
                                        className="h-20 w-20 shrink-0 overflow-hidden"
                                        style={{
                                            borderRadius: 'calc(var(--radius, 8px) * 0.5)',
                                            backgroundColor: 'var(--color-surface, #f0f0f0)',
                                        }}
                                    >
                                        {item.image && (
                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4
                                                    className="text-sm font-medium leading-snug"
                                                    style={{ color: 'var(--color-foreground, #1a1a1a)' }}
                                                >
                                                    {item.name}
                                                </h4>
                                                {item.variant_name && (
                                                    <div className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted, #888)' }}>
                                                        {item.variant_name}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="shrink-0 p-1"
                                                style={{ color: 'var(--color-text-muted, #aaa)' }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div
                                                className="flex items-center"
                                                style={{
                                                    border: '1px solid var(--color-border, #e5e5e5)',
                                                    borderRadius: 'calc(var(--radius, 8px) * 0.5)',
                                                }}
                                            >
                                                <button
                                                    onClick={() => handleUpdate(item.id, Math.max(1, item.quantity - 1))}
                                                    className="flex h-7 w-7 items-center justify-center text-sm"
                                                    style={{ color: 'var(--color-foreground, #1a1a1a)' }}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    &minus;
                                                </button>
                                                <span
                                                    className="flex h-7 w-8 items-center justify-center text-xs font-medium"
                                                    style={{ color: 'var(--color-foreground, #1a1a1a)' }}
                                                >
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdate(item.id, item.quantity + 1)}
                                                    className="flex h-7 w-7 items-center justify-center text-sm"
                                                    style={{ color: 'var(--color-foreground, #1a1a1a)' }}
                                                    disabled={item.max_quantity !== null && item.quantity >= item.max_quantity}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span
                                                className="text-sm font-semibold"
                                                style={{ color: 'var(--color-foreground, #1a1a1a)' }}
                                            >
                                                {formatCurrency(item.price * item.quantity, shop.currency_symbol, shop.currency_decimals)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="px-6 pb-6 pt-4" style={{ borderTop: '1px solid var(--color-border, #e5e5e5)' }}>
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-muted, #666)' }}>Subtotal</span>
                            <span
                                className="text-base font-semibold"
                                style={{ color: 'var(--color-foreground, #1a1a1a)' }}
                            >
                                {formatCurrency(summary.subtotal, shop.currency_symbol, shop.currency_decimals)}
                            </span>
                        </div>
                        <a
                            href={`/store/${shop.slug}/checkout`}
                            className="block w-full py-3 text-center text-sm font-semibold uppercase tracking-wider text-white"
                            style={{
                                backgroundColor: 'var(--color-primary, #1a1a1a)',
                                borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                            }}
                        >
                            Checkout
                        </a>
                        <button
                            onClick={closeDrawer}
                            className="mt-2 block w-full py-2 text-center text-sm"
                            style={{ color: 'var(--color-text-muted, #666)' }}
                        >
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
