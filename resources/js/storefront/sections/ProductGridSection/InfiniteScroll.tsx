import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryItem {
    id: number;
    name: string;
    slug: string;
}

interface GridData {
    products?: ProductCardData[];
    categories?: CategoryItem[];
    total?: number;
    current_page?: number;
    last_page?: number;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name';

const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    price_asc: 'Price: Low to High',
    price_desc: 'Price: High to Low',
    name: 'Name: A-Z',
};

function sortProducts(products: ProductCardData[], sort: SortOption): ProductCardData[] {
    const sorted = [...products];
    switch (sort) {
        case 'price_asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'newest':
        default:
            return sorted;
    }
}

export function InfiniteScroll({ config, data }: SectionProps) {
    const gridData = narrowData<GridData>(data);
    const allProducts = gridData.products ?? [];
    const heading = config.heading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = config.currency_symbol as string | undefined;
    const currencyDecimals = config.currency_decimals as number | undefined;
    const productsPerPage = (config.products_per_page as number) ?? 12;

    const [sort, setSort] = useState<SortOption>('newest');
    const [visibleCount, setVisibleCount] = useState(productsPerPage);
    const [isLoading, setIsLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const sortedProducts = sortProducts(allProducts, sort);
    const visibleProducts = sortedProducts.slice(0, visibleCount);
    const hasMore = visibleCount < sortedProducts.length;

    const loadMore = useCallback(() => {
        if (!hasMore || isLoading) return;
        setIsLoading(true);
        setTimeout(() => {
            setVisibleCount((prev) => prev + productsPerPage);
            setIsLoading(false);
        }, 300);
    }, [hasMore, isLoading, productsPerPage]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore]);

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <ScrollAnimation>
                    <div
                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{ marginBottom: '32px' }}
                    >
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

                        <div style={{ position: 'relative' }}>
                            <select
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value as SortOption);
                                    setVisibleCount(productsPerPage);
                                }}
                                style={{
                                    appearance: 'none',
                                    padding: '10px 36px 10px 14px',
                                    fontSize: '14px',
                                    borderRadius: 'var(--radius, 8px)',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    fontFamily: 'var(--font-body, inherit)',
                                    cursor: 'pointer',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 10px center',
                                }}
                            >
                                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                                    <option key={key} value={key}>
                                        {sortLabels[key]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </ScrollAnimation>

                {visibleProducts.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '64px 0',
                            color: 'var(--color-muted-foreground, #6b7280)',
                            fontFamily: 'var(--font-body, inherit)',
                        }}
                    >
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            style={{ margin: '0 auto 16px' }}
                        >
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>No products found</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                            {visibleProducts.map((product, index) => (
                                <ScrollAnimation key={product.id} delay={index * 40}>
                                    <ProductCard
                                        product={product}
                                        shopSlug={shopSlug ?? ''}
                                        currencySymbol={currencySymbol}
                                        currencyDecimals={currencyDecimals}
                                    />
                                </ScrollAnimation>
                            ))}
                        </div>

                        {hasMore && (
                            <div
                                ref={sentinelRef}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '40px 0',
                                    gap: '8px',
                                    color: 'var(--color-muted-foreground, #6b7280)',
                                    fontFamily: 'var(--font-body, inherit)',
                                    fontSize: '14px',
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        animation: 'spin 1s linear infinite',
                                    }}
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                Loading more products...
                            </div>
                        )}

                        {!hasMore && visibleProducts.length > 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '32px 0 0',
                                    color: 'var(--color-muted-foreground, #6b7280)',
                                    fontFamily: 'var(--font-body, inherit)',
                                    fontSize: '13px',
                                }}
                            >
                                Showing all {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
