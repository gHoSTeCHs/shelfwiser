import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

export function Carousel({ config, data }: SectionProps) {
    const gridData = narrowData<CategoryGridData>(data);
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        updateScrollState();

        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);

        return () => {
            el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [updateScrollState, categories.length]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth * 0.8;
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    if (categories.length === 0) {
        return null;
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {(heading || subheading) && (
                    <ScrollAnimation>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
                    </ScrollAnimation>
                )}

                <ScrollAnimation>
                    <div style={{ position: 'relative' }}>
                        {canScrollLeft && (
                            <button
                                type="button"
                                onClick={() => scroll('left')}
                                aria-label="Scroll left"
                                className="hidden sm:flex"
                                style={{
                                    position: 'absolute',
                                    left: '-16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    cursor: 'pointer',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    const el = e.currentTarget;
                                    el.style.backgroundColor = 'var(--color-surface, #f3f4f6)';
                                    el.style.borderColor = 'var(--color-primary, #6366f1)';
                                }}
                                onMouseLeave={(e) => {
                                    const el = e.currentTarget;
                                    el.style.backgroundColor = 'var(--color-card-bg, #ffffff)';
                                    el.style.borderColor = 'var(--color-border, #e5e7eb)';
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                        )}

                        {canScrollRight && (
                            <button
                                type="button"
                                onClick={() => scroll('right')}
                                aria-label="Scroll right"
                                className="hidden sm:flex"
                                style={{
                                    position: 'absolute',
                                    right: '-16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    cursor: 'pointer',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    const el = e.currentTarget;
                                    el.style.backgroundColor = 'var(--color-surface, #f3f4f6)';
                                    el.style.borderColor = 'var(--color-primary, #6366f1)';
                                }}
                                onMouseLeave={(e) => {
                                    const el = e.currentTarget;
                                    el.style.backgroundColor = 'var(--color-card-bg, #ffffff)';
                                    el.style.borderColor = 'var(--color-border, #e5e7eb)';
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        )}

                        <div
                            ref={scrollRef}
                            className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch',
                                paddingBottom: '4px',
                            }}
                        >
                            {categories.map((category) => {
                                const categoryUrl = shopSlug
                                    ? `/store/${shopSlug}/products?category=${category.slug}`
                                    : '#';

                                return (
                                    <a
                                        key={category.id}
                                        href={categoryUrl}
                                        className="snap-start shrink-0 group"
                                        style={{
                                            width: '280px',
                                            display: 'block',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderRadius: 'var(--radius, 8px)',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'relative',
                                                paddingBottom: '75%',
                                                backgroundColor: 'var(--color-surface, #f3f4f6)',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    loading="lazy"
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.5s ease',
                                                    }}
                                                    className="group-hover:scale-110"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--color-muted, #9ca3af)',
                                                    }}
                                                >
                                                    <svg
                                                        width="48"
                                                        height="48"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1"
                                                    >
                                                        <path d="M3 3h7l2 3h9v13H3z" />
                                                    </svg>
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background:
                                                        'linear-gradient(transparent 40%, rgba(0,0,0,0.65))',
                                                }}
                                            />

                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    padding: '16px 20px',
                                                }}
                                            >
                                                <h3
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                                        fontWeight: 600,
                                                        color: '#ffffff',
                                                        fontFamily: 'var(--font-heading, inherit)',
                                                    }}
                                                >
                                                    {category.name}
                                                </h3>
                                                {(category.product_count ?? 0) > 0 && (
                                                    <p
                                                        style={{
                                                            marginTop: '4px',
                                                            fontSize: '13px',
                                                            color: 'rgba(255,255,255,0.8)',
                                                            fontFamily: 'var(--font-body, inherit)',
                                                        }}
                                                    >
                                                        {category.product_count ?? 0} product
                                                        {(category.product_count ?? 0) !== 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
