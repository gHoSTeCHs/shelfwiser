import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';
import { formatCurrency } from '../../lib/formatters';
import type { FixedPageProps, ServiceAddonData, ServiceDetailPageData, ServiceVariantData } from '../../types/storefront';

interface SelectedAddon {
    addon_id: number;
    quantity: number;
}

export function ServiceDetailPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as ServiceDetailPageData;
    const service = pageData.service;

    const activeVariants = service?.variants.filter((v) => v.is_active) ?? [];
    const [selectedVariantId, setSelectedVariantId] = useState<number>(activeVariants[0]?.id ?? 0);
    const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!service) {
        return (
            <div style={{ maxWidth: 'var(--container-width, 1280px)', margin: '0 auto', padding: '80px 24px', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
                <h2 style={{ fontSize: '20px', color: 'var(--color-foreground, #111)' }}>Service not found</h2>
                <a href={`/store/${shop.slug}/services`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Browse services</a>
            </div>
        );
    }

    const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId);
    const basePrice = selectedVariant?.price ?? 0;
    const addonsTotal = selectedAddons.reduce((sum, sa) => {
        const addon = service.addons.find((a) => a.id === sa.addon_id);
        return sum + (addon?.price ?? 0) * sa.quantity;
    }, 0);
    const totalPrice = (basePrice + addonsTotal) * quantity;
    const duration = selectedVariant?.duration_minutes ?? 0;

    function toggleAddon(addon: ServiceAddonData) {
        setSelectedAddons((prev) => {
            const exists = prev.find((a) => a.addon_id === addon.id);
            if (exists) {
                return prev.filter((a) => a.addon_id !== addon.id);
            }
            return [...prev, { addon_id: addon.id, quantity: 1 }];
        });
    }

    function isAddonSelected(addonId: number): boolean {
        return selectedAddons.some((a) => a.addon_id === addonId);
    }

    async function handleAddToCart() {
        if (!selectedVariantId) return;
        setAdding(true);
        setError('');
        setMessage('');

        const result = await storefrontFetch<{ message: string }>(
            `/store/${shop.slug}/api/cart/service`,
            {
                method: 'POST',
                json: {
                    service_variant_id: selectedVariantId,
                    quantity,
                    selected_addons: selectedAddons.length > 0 ? selectedAddons : undefined,
                },
            },
        );

        if (result.ok) {
            setMessage('Added to cart!');
            setTimeout(() => setMessage(''), 3000);
        } else {
            setError(result.data?.message ?? 'Failed to add to cart.');
        }
        setAdding(false);
    }

    const fmt = (amount: number) => formatCurrency(amount, shop.currency_symbol, shop.currency_decimals);

    return (
        <div style={{ maxWidth: 'var(--container-width, 1280px)', margin: '0 auto', padding: 'var(--section-spacing, 64px) 24px', fontFamily: 'var(--font-body)' }}>
            <a href={`/store/${shop.slug}/services`} style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--color-muted-foreground, #6b7280)', textDecoration: 'none', fontSize: '13px' }}>
                &larr; Back to services
            </a>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
                <div>
                    {service.category_name && (
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 500, color: 'var(--color-primary, #111)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {service.category_name}
                        </p>
                    )}
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 16px' }}>
                        {service.name}
                    </h1>
                    {service.description && (
                        <div style={{ fontSize: '15px', color: 'var(--color-muted-foreground, #6b7280)', lineHeight: 1.7, maxWidth: '640px' }}>
                            {service.description}
                        </div>
                    )}
                </div>

                <div style={{ border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)', padding: '28px' }}>
                    {activeVariants.length > 1 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground, #111)', marginBottom: '8px' }}>
                                Select Option
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {activeVariants.map((variant) => (
                                    <VariantOption
                                        key={variant.id}
                                        variant={variant}
                                        selected={selectedVariantId === variant.id}
                                        onSelect={() => setSelectedVariantId(variant.id)}
                                        shop={shop}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {service.addons.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground, #111)', marginBottom: '8px' }}>
                                Add-ons
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {service.addons.map((addon) => (
                                    <label
                                        key={addon.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 14px',
                                            border: `1px solid ${isAddonSelected(addon.id) ? 'var(--color-primary, #111)' : 'var(--color-border, #e5e7eb)'}`,
                                            borderRadius: 'var(--radius, 6px)',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isAddonSelected(addon.id)}
                                                onChange={() => toggleAddon(addon)}
                                            />
                                            <span style={{ color: 'var(--color-foreground, #111)' }}>{addon.name}</span>
                                        </div>
                                        <span style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '13px' }}>
                                            +{fmt(addon.price)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground, #111)', marginBottom: '8px' }}>
                            Quantity
                        </label>
                        <select
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid var(--color-border, #e5e7eb)',
                                borderRadius: 'var(--radius, 6px)',
                                backgroundColor: 'var(--color-surface, #fff)',
                                color: 'var(--color-foreground, #111)',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ padding: '16px 0', borderTop: '1px solid var(--color-border, #e5e7eb)', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)', marginBottom: '4px' }}>
                            <span>Base price</span>
                            <span>{fmt(basePrice)}</span>
                        </div>
                        {addonsTotal > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)', marginBottom: '4px' }}>
                                <span>Add-ons</span>
                                <span>+{fmt(addonsTotal)}</span>
                            </div>
                        )}
                        {quantity > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)', marginBottom: '4px' }}>
                                <span>Quantity</span>
                                <span>&times; {quantity}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground, #111)', paddingTop: '8px', borderTop: '1px solid var(--color-border, #e5e7eb)' }}>
                            <span>Total</span>
                            <span>{fmt(totalPrice)}</span>
                        </div>
                        {duration > 0 && (
                            <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                                Estimated duration: {duration} minutes
                            </p>
                        )}
                    </div>

                    {message && (
                        <div style={{ padding: '10px 16px', marginBottom: '12px', backgroundColor: '#10b981', color: '#fff', borderRadius: 'var(--radius, 6px)', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                    {error && (
                        <div style={{ padding: '10px 16px', marginBottom: '12px', backgroundColor: 'var(--color-destructive, #ef4444)', color: '#fff', borderRadius: 'var(--radius, 6px)', fontSize: '14px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={adding || !selectedVariantId}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '14px',
                            border: 'none',
                            borderRadius: 'var(--radius, 6px)',
                            backgroundColor: adding ? 'var(--color-muted, #9ca3af)' : 'var(--color-primary, #111)',
                            color: 'var(--color-primary-foreground, #fff)',
                            fontWeight: 600,
                            fontSize: '15px',
                            cursor: adding || !selectedVariantId ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        {adding ? 'Adding...' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function VariantOption({ variant, selected, onSelect, shop }: { variant: ServiceVariantData; selected: boolean; onSelect: () => void; shop: FixedPageProps['shop'] }) {
    return (
        <label
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                border: `2px solid ${selected ? 'var(--color-primary, #111)' : 'var(--color-border, #e5e7eb)'}`,
                borderRadius: 'var(--radius, 6px)',
                cursor: 'pointer',
                fontSize: '14px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="radio" name="variant" checked={selected} onChange={onSelect} />
                <div>
                    <span style={{ color: 'var(--color-foreground, #111)', fontWeight: 500 }}>{variant.name}</span>
                    {variant.duration_minutes > 0 && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                            ({variant.duration_minutes} min)
                        </span>
                    )}
                </div>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--color-foreground, #111)' }}>
                {formatCurrency(variant.price, shop.currency_symbol, shop.currency_decimals)}
            </span>
        </label>
    );
}
