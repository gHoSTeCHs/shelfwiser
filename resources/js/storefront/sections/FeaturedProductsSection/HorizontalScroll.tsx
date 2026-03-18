import React, { useCallback, useRef, useState } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface FeaturedData {
    products?: ProductCardData[];
    title?: string;
    subtitle?: string;
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
        if (!el) {
            return;
        }
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const scrollAmount = el.clientWidth * 0.75;
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    if (products.length === 0) {
        return null;
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <ScrollAnimation>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            marginBottom: '32px',
                        }}
                    >
                        <div>
                            {heading && (
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                                        fontWeight: 700,
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
                                        marginTop: '8px',
                                        fontSize: '1rem',
                                        color: 'var(--color-muted-foreground, #6b7280)',
                                        fontFamily: 'var(--font-body, inherit)',
                                    }}
                                >
                                    {subheading}
                                </p>
                            )}
                        </div>

                        <div className="hidden sm:flex" style={{ gap: '8px' }}>
                            <button
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                aria-label="Scroll left"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    cursor: canScrollLeft ? 'pointer' : 'default',
                                    opacity: canScrollLeft ? 1 : 0.4,
                                    transition: 'opacity 0.2s ease',
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                aria-label="Scroll right"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    cursor: canScrollRight ? 'pointer' : 'default',
                                    opacity: canScrollRight ? 1 : 0.4,
                                    transition: 'opacity 0.2s ease',
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </ScrollAnimation>

                <div
                    ref={scrollRef}
                    onScroll={updateScrollState}
                    style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: '4px',
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
