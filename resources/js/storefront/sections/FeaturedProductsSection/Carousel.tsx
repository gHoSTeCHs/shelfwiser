import { useCallback, useEffect, useRef, useState } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface FeaturedData {
    products?: ProductCardData[];
    title?: string;
    subtitle?: string;
}

function NavBtn({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            aria-label={direction === 'left' ? 'Previous page' : 'Next page'}
            className="hidden sm:flex"
            style={{
                position: 'absolute',
                [direction === 'left' ? 'left' : 'right']: -20,
                top: '50%',
                transform: hovered ? 'translateY(-50%) scale(1.05)' : 'translateY(-50%) scale(1)',
                zIndex: 2,
                width: 42,
                height: 42,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: hovered
                    ? 'var(--color-primary, #e94560)'
                    : 'var(--color-card-bg, #ffffff)',
                color: hovered ? '#fff' : 'var(--color-foreground, #111827)',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
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

export function Carousel({ config, data }: SectionProps) {
    const featuredData = narrowData<FeaturedData>(data);
    const products = featuredData.products ?? [];
    const heading = (config.heading as string) || featuredData.title;
    const subheading = (config.subheading as string) || featuredData.subtitle;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = config.currency_symbol as string | undefined;
    const currencyDecimals = config.currency_decimals as number | undefined;

    const trackRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4);

    const totalPages = Math.ceil(products.length / itemsPerPage);

    useEffect(() => {
        function updateItemsPerPage() {
            const width = window.innerWidth;
            if (width < 640) setItemsPerPage(2);
            else if (width < 768) setItemsPerPage(3);
            else setItemsPerPage(4);
        }
        updateItemsPerPage();
        window.addEventListener('resize', updateItemsPerPage);
        return () => window.removeEventListener('resize', updateItemsPerPage);
    }, []);

    useEffect(() => {
        if (totalPages <= 1) return;
        const timer = setInterval(() => {
            setCurrentPage((prev) => (prev + 1) % totalPages);
        }, 5000);
        return () => clearInterval(timer);
    }, [totalPages]);

    const goToPage = useCallback(
        (page: number) => {
            setCurrentPage(((page % totalPages) + totalPages) % totalPages);
        },
        [totalPages],
    );

    if (products.length === 0) return null;

    const offset = currentPage * itemsPerPage;
    const visibleProducts = products.slice(offset, offset + itemsPerPage);

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

                <div style={{ position: 'relative' }}>
                    {totalPages > 1 && (
                        <>
                            <NavBtn direction="left" onClick={() => goToPage(currentPage - 1)} />
                            <NavBtn direction="right" onClick={() => goToPage(currentPage + 1)} />
                        </>
                    )}

                    <div ref={trackRef} style={{ overflow: 'hidden' }}>
                        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                            {visibleProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    shopSlug={shopSlug ?? ''}
                                    currencySymbol={currencySymbol}
                                    currencyDecimals={currencyDecimals}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Dot indicators */}
                {totalPages > 1 && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 8,
                            marginTop: 28,
                        }}
                    >
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => goToPage(i)}
                                aria-label={`Go to page ${i + 1}`}
                                style={{
                                    width: i === currentPage ? 28 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    backgroundColor: i === currentPage
                                        ? 'var(--color-primary, #e94560)'
                                        : 'var(--color-border, #e5e7eb)',
                                    transition: 'width 0.3s ease, background-color 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
