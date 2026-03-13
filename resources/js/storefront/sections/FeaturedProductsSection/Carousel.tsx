import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';

interface FeaturedData {
    products?: ProductCardData[];
    title?: string;
    subtitle?: string;
}

export function Carousel({ config, data }: SectionProps) {
    const featuredData = data as unknown as FeaturedData;
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
            if (width < 640) {
                setItemsPerPage(2);
            } else if (width < 768) {
                setItemsPerPage(3);
            } else {
                setItemsPerPage(4);
            }
        }

        updateItemsPerPage();
        window.addEventListener('resize', updateItemsPerPage);
        return () => window.removeEventListener('resize', updateItemsPerPage);
    }, []);

    useEffect(() => {
        if (totalPages <= 1) {
            return;
        }

        const timer = setInterval(() => {
            setCurrentPage((prev) => (prev + 1) % totalPages);
        }, 5000);

        return () => clearInterval(timer);
    }, [totalPages]);

    const goToPage = useCallback(
        (page: number) => {
            setCurrentPage(((page % totalPages) + totalPages) % totalPages);
        },
        [totalPages]
    );

    if (products.length === 0) {
        return null;
    }

    const offset = currentPage * itemsPerPage;
    const visibleProducts = products.slice(offset, offset + itemsPerPage);

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

                <div style={{ position: 'relative' }}>
                    {totalPages > 1 && (
                        <>
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                aria-label="Previous page"
                                className="hidden sm:flex"
                                style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 2,
                                    width: '40px',
                                    height: '40px',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                                onClick={() => goToPage(currentPage + 1)}
                                aria-label="Next page"
                                className="hidden sm:flex"
                                style={{
                                    position: 'absolute',
                                    right: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 2,
                                    width: '40px',
                                    height: '40px',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                        </>
                    )}

                    <div ref={trackRef} style={{ overflow: 'hidden' }}>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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

                {totalPages > 1 && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            marginTop: '24px',
                        }}
                    >
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => goToPage(i)}
                                aria-label={`Go to page ${i + 1}`}
                                style={{
                                    width: i === currentPage ? '32px' : '10px',
                                    height: '10px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor:
                                        i === currentPage
                                            ? 'var(--color-primary, #6366f1)'
                                            : 'var(--color-border, #e5e7eb)',
                                    transition: 'all 0.3s ease',
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
