import { useState, useRef } from 'react';
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

function SaleBadge({ comparePrice, price }: { comparePrice: number; price: number }) {
    const discount = Math.round(((comparePrice - price) / comparePrice) * 100);
    return (
        <span
            className="absolute left-3 top-3 z-10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
            style={{
                backgroundColor: 'var(--color-accent, #D97706)',
                color: '#fff',
                borderRadius: '4px',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.25)',
            }}
        >
            -{discount}%
        </span>
    );
}

function PriceDisplay({ product, shop }: { product: ProductCardData; shop: ShopData }) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    return (
        <div className="flex items-baseline gap-2">
            <span
                className="text-[15px] font-bold tracking-tight"
                style={{ color: hasDiscount ? 'var(--color-accent, #D97706)' : 'var(--color-text, #0C1713)' }}
            >
                {formatCurrency(product.price, shop.currency_symbol, shop.currency_decimals)}
            </span>
            {hasDiscount && (
                <span
                    className="text-xs font-medium line-through"
                    style={{ color: 'var(--color-text-muted, #9CA3AF)', textDecorationColor: 'var(--color-text-muted, #9CA3AF)' }}
                >
                    {formatCurrency(product.compare_at_price!, shop.currency_symbol, shop.currency_decimals)}
                </span>
            )}
        </div>
    );
}

function ImagePlaceholder() {
    return (
        <div
            className="flex h-full w-full flex-col items-center justify-center gap-3"
            style={{ backgroundColor: 'var(--color-surface, #F0FDF4)' }}
        >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25 }}>
                <rect x="2" y="2" width="20" height="20" rx="3" stroke="var(--color-text-muted, #9CA3AF)" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" stroke="var(--color-text-muted, #9CA3AF)" strokeWidth="1.5" />
                <path d="M2 17l5-5 3 3 4-4 8 8v1a2 2 0 01-2 2H4a2 2 0 01-2-2v-3z" fill="var(--color-text-muted, #9CA3AF)" fillOpacity="0.15" />
            </svg>
            <span className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--color-text-muted, #9CA3AF)', opacity: 0.5 }}>
                No image
            </span>
        </div>
    );
}

function DefaultCard({ product, shop, onQuickAdd }: CardVariantProps) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLAnchorElement>(null);

    return (
        <a
            ref={cardRef}
            href={`/store/${shop.slug}/products/${product.slug}`}
            className="group block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="relative mb-4 overflow-hidden"
                style={{
                    borderRadius: 'var(--img-radius, var(--radius, 8px))',
                    border: 'var(--card-border, 1px solid transparent)',
                    aspectRatio: '3/4',
                    boxShadow: isHovered
                        ? '0 12px 40px -8px rgba(0,0,0,0.15), 0 4px 12px -4px rgba(0,0,0,0.08)'
                        : 'var(--shadow-depth, 0 1px 3px rgba(0,0,0,0.06))',
                    transition: 'box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {product.compare_at_price && product.compare_at_price > product.price && (
                    <SaleBadge comparePrice={product.compare_at_price} price={product.price} />
                )}

                {product.is_new && (
                    <span
                        className="absolute right-3 top-3 z-10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                        style={{
                            backgroundColor: 'var(--color-primary, #047857)',
                            color: '#fff',
                            borderRadius: '4px',
                            letterSpacing: '0.05em',
                        }}
                    >
                        New
                    </span>
                )}

                <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface, #F0FDF4)' }}>
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            style={{
                                transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                                transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        />
                    ) : (
                        <ImagePlaceholder />
                    )}
                </div>

                {onQuickAdd && (
                    <button
                        onClick={(e) => { e.preventDefault(); onQuickAdd(product.id); }}
                        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold uppercase tracking-wider"
                        style={{
                            backgroundColor: 'var(--color-primary, #047857)',
                            color: '#fff',
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
                            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add to Cart
                    </button>
                )}
            </div>

            <div className="space-y-1.5 px-0.5">
                {product.category_name && (
                    <div
                        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: 'var(--color-primary, #047857)' }}
                    >
                        {product.category_name}
                    </div>
                )}
                <h3
                    className="text-[15px] font-medium leading-snug"
                    style={{
                        color: 'var(--color-text, #0C1713)',
                        fontFamily: 'var(--font-body, sans-serif)',
                        transition: 'color 0.2s ease',
                        ...(isHovered ? { color: 'var(--color-primary, #047857)' } : {}),
                    }}
                >
                    {product.name}
                </h3>
                <PriceDisplay product={product} shop={shop} />
            </div>
        </a>
    );
}

function MinimalCard({ product, shop }: CardVariantProps) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <a
            href={`/store/${shop.slug}/products/${product.slug}`}
            className="block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="relative mb-3 overflow-hidden"
                style={{
                    aspectRatio: '1/1',
                    borderRadius: 'var(--radius, 8px)',
                }}
            >
                <div className="h-full w-full" style={{ backgroundColor: 'var(--color-surface, #F0FDF4)' }}>
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            style={{
                                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        />
                    ) : (
                        <ImagePlaceholder />
                    )}
                </div>
            </div>
            <h3
                className="text-sm font-medium"
                style={{
                    color: 'var(--color-text, #0C1713)',
                    fontFamily: 'var(--font-body, sans-serif)',
                }}
            >
                {product.name}
            </h3>
            <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-muted, #4B5563)' }}>
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
            style={{
                borderRadius: 'var(--radius, 8px)',
                aspectRatio: '3/4',
                boxShadow: isHovered
                    ? '0 20px 50px -12px rgba(0,0,0,0.3)'
                    : '0 4px 12px -2px rgba(0,0,0,0.1)',
                transition: 'box-shadow 0.4s ease',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {product.compare_at_price && product.compare_at_price > product.price && (
                <SaleBadge comparePrice={product.compare_at_price} price={product.price} />
            )}
            <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-surface, #F0FDF4)' }}>
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        style={{
                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                            transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    />
                ) : (
                    <ImagePlaceholder />
                )}
            </div>
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)',
                    opacity: isHovered ? 1 : 0.85,
                    transition: 'opacity 0.4s ease',
                }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-5">
                {product.category_name && (
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                        {product.category_name}
                    </div>
                )}
                <h3 className="text-[15px] font-semibold leading-snug text-white">{product.name}</h3>
                <div className="mt-1.5 text-sm font-bold text-white">
                    {formatCurrency(product.price, shop.currency_symbol, shop.currency_decimals)}
                </div>
                {onQuickAdd && (
                    <button
                        onClick={(e) => { e.preventDefault(); onQuickAdd(product.id); }}
                        className="mt-3 flex w-full items-center justify-center gap-2 py-2.5 text-center text-[12px] font-semibold uppercase tracking-wider text-white"
                        style={{
                            backgroundColor: 'var(--color-primary, rgba(255,255,255,0.15))',
                            borderRadius: 'var(--radius, 8px)',
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
                            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add to Cart
                    </button>
                )}
            </div>
        </a>
    );
}

function DetailedCard({ product, shop, onQuickAdd }: CardVariantProps) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <a
            href={`/store/${shop.slug}/products/${product.slug}`}
            className="block overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                borderRadius: 'var(--img-radius, var(--radius, 8px))',
                border: 'var(--card-border, 1px solid var(--color-border, #e5e7eb))',
                backgroundColor: 'var(--color-background, #fff)',
                boxShadow: isHovered
                    ? '0 12px 40px -8px rgba(0,0,0,0.12), 0 0 0 1px var(--color-primary, #047857)'
                    : 'var(--shadow-depth, 0 1px 3px rgba(0,0,0,0.04))',
                borderColor: isHovered ? 'var(--color-primary, #047857)' : undefined,
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <div
                className="relative overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface, #F0FDF4)', aspectRatio: '4/3' }}
            >
                {product.compare_at_price && product.compare_at_price > product.price && (
                    <SaleBadge comparePrice={product.compare_at_price} price={product.price} />
                )}
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        style={{
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    />
                ) : (
                    <ImagePlaceholder />
                )}
            </div>
            <div className="p-4">
                {product.category_name && (
                    <div
                        className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: 'var(--color-primary, #047857)' }}
                    >
                        {product.category_name}
                    </div>
                )}
                <h3
                    className="mb-2 text-[15px] font-medium leading-snug"
                    style={{ color: 'var(--color-text, #0C1713)' }}
                >
                    {product.name}
                </h3>
                <div className="flex items-center justify-between">
                    <PriceDisplay product={product} shop={shop} />
                    {onQuickAdd && (
                        <button
                            onClick={(e) => { e.preventDefault(); onQuickAdd(product.id); }}
                            className="flex h-9 w-9 items-center justify-center transition-all duration-300"
                            style={{
                                backgroundColor: isHovered ? 'var(--color-primary, #047857)' : 'var(--color-surface, #F0FDF4)',
                                color: isHovered ? '#fff' : 'var(--color-text, #0C1713)',
                                borderRadius: 'calc(var(--radius, 8px) * 0.5)',
                                boxShadow: isHovered ? '0 4px 12px -2px rgba(0,0,0,0.2)' : 'none',
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
