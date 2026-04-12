import { useState } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface GridData {
    products?: ProductCardData[];
    total?: number;
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

export function StandardGrid({ config, data }: SectionProps) {
    const gridData = narrowData<GridData>(data);
    const allProducts = gridData.products ?? [];
    const heading = config.heading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = config.currency_symbol as string | undefined;
    const currencyDecimals = config.currency_decimals as number | undefined;
    const productsPerPage = (config.products_per_page as number) ?? 12;

    const [sort, setSort] = useState<SortOption>('newest');
    const [visibleCount, setVisibleCount] = useState(productsPerPage);
    const [loadHovered, setLoadHovered] = useState(false);

    const sortedProducts = sortProducts(allProducts, sort);
    const visibleProducts = sortedProducts.slice(0, visibleCount);
    const hasMore = visibleCount < sortedProducts.length;

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <ScrollAnimation>
                    <div
                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{ marginBottom: 36 }}
                    >
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

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            style={{
                                appearance: 'none',
                                padding: '10px 36px 10px 14px',
                                fontSize: 14,
                                fontWeight: 500,
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
                                <option key={key} value={key}>{sortLabels[key]}</option>
                            ))}
                        </select>
                    </div>
                </ScrollAnimation>

                {visibleProducts.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '80px 0',
                            color: 'var(--color-muted-foreground, #6b7280)',
                            fontFamily: 'var(--font-body, inherit)',
                        }}
                    >
                        <p style={{ fontSize: 16, fontWeight: 600 }}>No products found</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
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
                            <div style={{ textAlign: 'center', marginTop: 44 }}>
                                <button
                                    onClick={() => setVisibleCount((prev) => prev + productsPerPage)}
                                    style={{
                                        padding: '13px 36px',
                                        fontSize: 14,
                                        fontWeight: 700,
                                        borderRadius: 'var(--radius, 8px)',
                                        border: 'none',
                                        backgroundColor: loadHovered
                                            ? 'var(--color-foreground, #111)'
                                            : 'var(--color-primary, #e94560)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-body, inherit)',
                                        transition: 'background-color 0.2s ease',
                                    }}
                                    onMouseEnter={() => setLoadHovered(true)}
                                    onMouseLeave={() => setLoadHovered(false)}
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
