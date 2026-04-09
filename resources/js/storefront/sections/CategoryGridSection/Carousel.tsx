import { useRef, useState, useCallback, useEffect } from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

function CarouselCard({ category, shopSlug }: { category: CategoryData; shopSlug?: string }) {
    const [hovered, setHovered] = useState(false);
    const categoryUrl = shopSlug
        ? `/store/${shopSlug}/products?category=${category.slug}`
        : '#';

    return (
        <a
            href={categoryUrl}
            className="snap-start shrink-0"
            style={{
                width: 280,
                display: 'block',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius, 8px)',
                textDecoration: 'none',
                color: 'inherit',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                style={{
                    position: 'relative',
                    paddingBottom: '80%',
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
                            transform: hovered ? 'scale(1.08)' : 'scale(1)',
                            transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: `
                                radial-gradient(ellipse 70% 60% at 30% 70%, var(--color-primary, #047857) 0%, transparent 55%),
                                radial-gradient(ellipse 50% 50% at 80% 30%, var(--color-secondary, #064E3B) 0%, transparent 50%),
                                linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)
                            `,
                        }}
                    />
                )}

                {/* Multi-stop overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(
                            to bottom,
                            rgba(0,0,0,0.03) 0%,
                            rgba(0,0,0,0.02) 35%,
                            rgba(0,0,0,0.3) 60%,
                            rgba(0,0,0,0.72) 100%
                        )`,
                        opacity: hovered ? 0.85 : 1,
                        transition: 'opacity 0.4s ease',
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '18px 20px',
                        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            color: '#ffffff',
                            fontFamily: 'var(--font-heading, inherit)',
                        }}
                    >
                        {category.name}
                    </h3>

                    <div className="flex items-center gap-3" style={{ marginTop: 6 }}>
                        {(category.product_count ?? 0) > 0 && (
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'rgba(255,255,255,0.8)',
                                    fontFamily: 'var(--font-body, inherit)',
                                }}
                            >
                                {category.product_count} item{(category.product_count ?? 0) !== 1 ? 's' : ''}
                            </span>
                        )}

                        <span
                            className="flex items-center gap-1"
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#fff',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                opacity: hovered ? 1 : 0,
                                transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
                                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        >
                            Shop
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
}

function ScrollButton({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Scroll ${direction}`}
            className="hidden sm:flex"
            style={{
                position: 'absolute',
                [direction === 'left' ? 'left' : 'right']: -20,
                top: '50%',
                zIndex: 10,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: hovered
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: hovered
                    ? 'var(--color-primary, #e94560)'
                    : 'var(--color-foreground, #111827)',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: hovered
                    ? '0 8px 24px -4px rgba(0,0,0,0.15)'
                    : '0 4px 12px -2px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                transform: hovered
                    ? 'translateY(-50%) scale(1.08)'
                    : 'translateY(-50%) scale(1)',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
            </svg>
        </button>
    );
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
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
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
        const scrollAmount = el.clientWidth * 0.75;
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    if (categories.length === 0) return null;

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {(heading || subheading) && (
                    <ScrollAnimation>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            {heading && (
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                        fontWeight: 800,
                                        letterSpacing: '-0.03em',
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
                                        marginTop: 10,
                                        fontSize: '1.05rem',
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
                        {/* Scroll buttons */}
                        {canScrollLeft && (
                            <ScrollButton direction="left" onClick={() => scroll('left')} />
                        )}
                        {canScrollRight && (
                            <ScrollButton direction="right" onClick={() => scroll('right')} />
                        )}

                        {/* Edge fade indicators */}
                        {canScrollLeft && (
                            <div
                                className="hidden sm:block"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 48,
                                    background: 'linear-gradient(to right, var(--color-background, #fff), transparent)',
                                    zIndex: 5,
                                    pointerEvents: 'none',
                                    borderRadius: 'var(--radius, 8px) 0 0 var(--radius, 8px)',
                                }}
                            />
                        )}
                        {canScrollRight && (
                            <div
                                className="hidden sm:block"
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 48,
                                    background: 'linear-gradient(to left, var(--color-background, #fff), transparent)',
                                    zIndex: 5,
                                    pointerEvents: 'none',
                                    borderRadius: '0 var(--radius, 8px) var(--radius, 8px) 0',
                                }}
                            />
                        )}

                        {/* Scroll track */}
                        <div
                            ref={scrollRef}
                            className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch',
                                paddingBottom: 4,
                            }}
                        >
                            {categories.map((category) => (
                                <CarouselCard
                                    key={category.id}
                                    category={category}
                                    shopSlug={shopSlug}
                                />
                            ))}
                        </div>
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
