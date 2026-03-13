import { useState } from 'react';
import { formatCurrency } from '../lib/formatters';
import type { ShopData, ProductCardConfig, ProductCardData } from '../types/storefront';

export type { ProductCardData } from '../types/storefront';

export interface ProductCardProps {
    product: ProductCardData;
    shop?: ShopData;
    shopSlug?: string;
    currencySymbol?: string;
    currencyDecimals?: number;
    cardConfig?: ProductCardConfig;
    cardVariant?: string;
    onQuickAdd?: (productId: number) => void;
}

export function ProductCard({ product, shop, shopSlug, currencySymbol, currencyDecimals, cardConfig, cardVariant, onQuickAdd }: ProductCardProps) {
    const variant = cardVariant ?? cardConfig?.variant ?? 'default';
    const resolvedSlug = shopSlug ?? shop?.slug ?? '';
    const resolvedSymbol = currencySymbol ?? shop?.currency_symbol ?? '₦';
    const resolvedDecimals = currencyDecimals ?? shop?.currency_decimals ?? 2;
    const resolvedShop: ShopData = shop ?? {
        id: 0, name: '', slug: resolvedSlug, currency: 'NGN',
        currency_symbol: resolvedSymbol, currency_decimals: resolvedDecimals,
        logo: null, favicon: null,
    };

    switch (variant) {
        case 'minimal':
            return <MinimalCard product={product} shop={resolvedShop} />;
        case 'overlay':
            return <OverlayCard product={product} shop={resolvedShop} onQuickAdd={onQuickAdd} />;
        case 'detailed':
            return <DetailedCard product={product} shop={resolvedShop} onQuickAdd={onQuickAdd} />;
        default:
            return <DefaultCard product={product} shop={resolvedShop} onQuickAdd={onQuickAdd} />;
    }
}

interface CardVariantProps {
    product: ProductCardData;
    shop: ShopData;
    onQuickAdd?: (productId: number) => void;
}

function SaleBadge({ comparePrice, price, shop }: { comparePrice: number; price: number; shop: ShopData }) {
    const discount = Math.round(((comparePrice - price) / comparePrice) * 100);
    return (
        <span
            className="absolute left-3 top-3 z-10 px-2 py-1 text-xs font-semibold"
            style={{
                backgroundColor: 'var(--color-accent, #f59e0b)',
                color: '#fff',
                borderRadius: 'calc(var(--radius, 8px) * 0.5)',
            }}
        >
            -{discount}%
        </span>
    );
}

function PriceDisplay({ product, shop }: { product: ProductCardData; shop: ShopData }) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    return (
        <div className="flex items-center gap-2">
            <span
                className="text-sm font-semibold"
                style={{ color: hasDiscount ? 'var(--color-accent, #e94560)' : 'var(--color-text, #1a1a1a)' }}
            >
                {formatCurrency(product.price, shop.currency_symbol, shop.currency_decimals)}
            </span>
            {hasDiscount && (
                <span
                    className="text-xs line-through"
                    style={{ color: 'var(--color-text-muted, #999)' }}
                >
                    {formatCurrency(product.compare_at_price!, shop.currency_symbol, shop.currency_decimals)}
                </span>
            )}
        </div>
    );
}

function DefaultCard({ product, shop, onQuickAdd }: CardVariantProps) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <a
            href={`/store/${shop.slug}/products/${product.slug}`}
            className="group block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="relative mb-3 overflow-hidden"
                style={{
                    borderRadius: 'var(--radius, 8px)',
                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                    aspectRatio: '3/4',
                }}
            >
                {product.compare_at_price && product.compare_at_price > product.price && (
                    <SaleBadge comparePrice={product.compare_at_price} price={product.price} shop={shop} />
                )}
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500"
                        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted, #ccc)" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
                {onQuickAdd && (
                    <button
                        onClick={(e) => { e.preventDefault(); onQuickAdd(product.id); }}
                        className="absolute bottom-3 left-3 right-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300"
                        style={{
                            backgroundColor: 'var(--color-primary, #1a1a1a)',
                            color: '#fff',
                            borderRadius: 'var(--radius, 8px)',
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
                        }}
                    >
                        Quick Add
                    </button>
                )}
            </div>
            {product.category_name && (
                <div
                    className="mb-1 text-xs uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted, #888)' }}
                >
                    {product.category_name}
                </div>
            )}
            <h3
                className="mb-1.5 text-sm font-medium leading-snug"
                style={{ color: 'var(--color-text, #1a1a1a)', fontFamily: 'var(--font-body, sans-serif)' }}
            >
                {product.name}
            </h3>
            <PriceDisplay product={product} shop={shop} />
        </a>
    );
}

function MinimalCard({ product, shop }: CardVariantProps) {
    return (
        <a href={`/store/${shop.slug}/products/${product.slug}`} className="block">
            <div
                className="relative mb-3 overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface, #f5f5f5)', aspectRatio: '1/1' }}
            >
                {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted, #ccc)" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        </svg>
                    </div>
                )}
            </div>
            <h3 className="text-sm" style={{ color: 'var(--color-text, #1a1a1a)' }}>{product.name}</h3>
            <div className="mt-1 text-sm" style={{ color: 'var(--color-text-muted, #666)' }}>
                {formatCurrency(product.price, shop.currency_symbol, shop.currency_decimals)}
            </div>
        </a>
    );
}

function OverlayCard({ product, shop, onQuickAdd }: CardVariantProps) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <a
            href={`/store/${shop.slug}/products/${product.slug}`}
            className="group relative block overflow-hidden"
            style={{ borderRadius: 'var(--radius, 8px)', aspectRatio: '3/4' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {product.compare_at_price && product.compare_at_price > product.price && (
                <SaleBadge comparePrice={product.compare_at_price} price={product.price} shop={shop} />
            )}
            <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-surface, #f0f0f0)' }}>
                {product.image && (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500"
                        style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
                    />
                )}
            </div>
            <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 50%)',
                    opacity: isHovered ? 1 : 0.7,
                }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-sm font-medium text-white">{product.name}</h3>
                <div className="mt-1 text-sm font-semibold text-white">
                    {formatCurrency(product.price, shop.currency_symbol, shop.currency_decimals)}
                </div>
                {onQuickAdd && (
                    <button
                        onClick={(e) => { e.preventDefault(); onQuickAdd(product.id); }}
                        className="mt-3 w-full py-2 text-center text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300"
                        style={{
                            backgroundColor: 'var(--color-primary, rgba(255,255,255,0.2))',
                            borderRadius: 'var(--radius, 8px)',
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                        }}
                    >
                        Quick Add
                    </button>
                )}
            </div>
        </a>
    );
}

function DetailedCard({ product, shop, onQuickAdd }: CardVariantProps) {
    return (
        <a
            href={`/store/${shop.slug}/products/${product.slug}`}
            className="block overflow-hidden transition-shadow duration-300 hover:shadow-lg"
            style={{
                borderRadius: 'var(--radius, 8px)',
                border: '1px solid var(--color-border, #e5e5e5)',
                backgroundColor: 'var(--color-background, #fff)',
            }}
        >
            <div
                className="relative overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface, #f5f5f5)', aspectRatio: '4/3' }}
            >
                {product.compare_at_price && product.compare_at_price > product.price && (
                    <SaleBadge comparePrice={product.compare_at_price} price={product.price} shop={shop} />
                )}
                {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted, #ccc)" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="p-4">
                {product.category_name && (
                    <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: 'var(--color-primary, #e94560)' }}>
                        {product.category_name}
                    </div>
                )}
                <h3
                    className="mb-2 text-sm font-medium leading-snug"
                    style={{ color: 'var(--color-text, #1a1a1a)' }}
                >
                    {product.name}
                </h3>
                <div className="flex items-center justify-between">
                    <PriceDisplay product={product} shop={shop} />
                    {onQuickAdd && (
                        <button
                            onClick={(e) => { e.preventDefault(); onQuickAdd(product.id); }}
                            className="flex h-8 w-8 items-center justify-center transition-colors"
                            style={{
                                backgroundColor: 'var(--color-primary, #1a1a1a)',
                                color: '#fff',
                                borderRadius: 'calc(var(--radius, 8px) * 0.5)',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </a>
    );
}
