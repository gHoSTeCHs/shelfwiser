import { useCallback, useRef, useState } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface FeaturedData {
    products?: ProductCardData[];
    title?: string;
    subtitle?: string;
}

function ScrollBtn({ direction, disabled, onClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={`Scroll ${direction}`}
            style={{
                width: 42,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: hovered && !disabled
                    ? 'var(--color-primary, #e94560)'
                    : 'var(--color-surface, #f3f4f6)',
                color: hovered && !disabled
                    ? '#fff'
                    : 'var(--color-foreground, #111827)',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.35 : 1,
                transition: 'background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
            </svg>
        </button>
    );
}

export function HorizontalScroll({ config, data }: SectionProps) {
    const featuredData = narrowData<FeaturedData>(data);
    const products = featuredData.products ?? [];
    const heading = (config.heading as string) || featuredData.title;
    const subheading = (config.subheading as string) || featuredData.subtitle;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = config.currency_symbol as string | undefined;
    const currencyDecimals = config.currency_decimals as number | undefined;

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({
            left: direction === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75,
            behavior: 'smooth',
        });
    }, []);

    if (products.length === 0) return null;

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <ScrollAnimation>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            marginBottom: 36,
                        }}
                    >
                        <div>
                            {heading && (
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                        fontWeight: 800,
                                        letterSpacing: '-0.03em',
                                        textTransform: 'var(--heading-transform, none)' as React.CSSProperties['textTransform'],
                                        color: 'var(--color-foreground, #111827)',
                                        fontFamily: 'var(--font-heading, inherit)',
                                    }}
                                >
                                    {heading}
                                </h2>
                            )}
                            {subheading && (
                                <p
                                    style={{
                                        marginTop: 8,
                                        fontSize: '1.05rem',
                                        color: 'var(--color-muted-foreground, #6b7280)',
                                        fontFamily: 'var(--font-body, inherit)',
                                    }}
                                >
                                    {subheading}
                                </p>
                            )}
                        </div>

                        <div className="hidden sm:flex" style={{ gap: 8 }}>
                            <ScrollBtn direction="left" disabled={!canScrollLeft} onClick={() => scroll('left')} />
                            <ScrollBtn direction="right" disabled={!canScrollRight} onClick={() => scroll('right')} />
                        </div>
                    </div>
                </ScrollAnimation>

                <div
                    ref={scrollRef}
                    onScroll={updateScrollState}
                    style={{
                        display: 'flex',
                        gap: 16,
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: 4,
                    }}
                >
                    {products.map((product) => (
                        <div
                            key={product.id}
                            style={{
                                flex: '0 0 auto',
                                width: 'clamp(220px, 45vw, 300px)',
                                scrollSnapAlign: 'start',
                            }}
                        >
                            <ProductCard
                                product={product}
                                shopSlug={shopSlug ?? ''}
                                currencySymbol={currencySymbol}
                                currencyDecimals={currencyDecimals}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
