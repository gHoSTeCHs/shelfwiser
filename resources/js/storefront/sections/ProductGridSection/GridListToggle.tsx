import { useState } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { formatCurrency } from '../../lib/formatters';
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
type ViewMode = 'grid' | 'list';

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

interface ListCardProps {
    product: ProductCardData;
    shopSlug: string;
    currencySymbol: string;
    currencyDecimals: number;
}

function ListCard({ product, shopSlug, currencySymbol, currencyDecimals }: ListCardProps) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discount = hasDiscount
        ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
        : 0;

    return (
        <a
            href={`/store/${shopSlug}/products/${product.slug}`}
            className="flex gap-4 sm:gap-6"
            style={{
                padding: '16px',
                borderRadius: 'var(--radius, 8px)',
                border: '1px solid var(--color-border, #e5e7eb)',
                backgroundColor: 'var(--color-card-bg, #ffffff)',
                textDecoration: 'none',
                transition: 'border-color 0.2s ease',
            }}
        >
            <div
                className="shrink-0"
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: 'calc(var(--radius, 8px) * 0.75)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                    position: 'relative',
                }}
            >
                {hasDiscount && (
                    <span
                        className="absolute left-2 top-2 z-10 px-1.5 py-0.5 text-xs font-semibold"
                        style={{
                            backgroundColor: 'var(--color-accent, #f59e0b)',
                            color: '#fff',
                            borderRadius: 'calc(var(--radius, 8px) * 0.5)',
                            fontSize: '11px',
                        }}
                    >
                        -{discount}%
                    </span>
                )}
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-text-muted, #ccc)"
                            strokeWidth="1"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {product.category_name && (
                    <div
                        className="mb-1 text-xs uppercase tracking-wider"
                        style={{ color: 'var(--color-muted-foreground, #6b7280)' }}
                    >
                        {product.category_name}
                    </div>
                )}
                <h3
                    className="mb-2 text-sm font-medium leading-snug sm:text-base"
                    style={{
                        margin: '0 0 8px',
                        color: 'var(--color-foreground, #111827)',
                        fontFamily: 'var(--font-body, inherit)',
                    }}
                >
                    {product.name}
                </h3>
                <div className="flex items-center gap-2">
                    <span
                        className="text-sm font-semibold"
                        style={{
                            color: hasDiscount
                                ? 'var(--color-accent, #e94560)'
                                : 'var(--color-foreground, #111827)',
                        }}
                    >
                        {formatCurrency(product.price, currencySymbol, currencyDecimals)}
                    </span>
                    {hasDiscount && (
                        <span
                            className="text-xs line-through"
                            style={{ color: 'var(--color-muted-foreground, #6b7280)' }}
                        >
                            {formatCurrency(product.compare_at_price!, currencySymbol, currencyDecimals)}
                        </span>
                    )}
                </div>
            </div>
        </a>
    );
}

export function GridListToggle({ config, data }: SectionProps) {
    const gridData = narrowData<GridData>(data);
    const allProducts = gridData.products ?? [];
    const heading = config.heading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = config.currency_symbol as string | undefined;
    const currencyDecimals = config.currency_decimals as number | undefined;
    const productsPerPage = (config.products_per_page as number) ?? 12;

    const [sort, setSort] = useState<SortOption>('newest');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [visibleCount, setVisibleCount] = useState(productsPerPage);

    const sortedProducts = sortProducts(allProducts, sort);
    const visibleProducts = sortedProducts.slice(0, visibleCount);
    const hasMore = visibleCount < sortedProducts.length;

    const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        border: '1px solid var(--color-border, #e5e7eb)',
        backgroundColor: active ? 'var(--color-primary, #e94560)' : 'var(--color-card-bg, #ffffff)',
        color: active ? '#fff' : 'var(--color-foreground, #111827)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    });

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    borderRadius: 'var(--radius, 8px)',
                                    overflow: 'hidden',
                                }}
                            >
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        ...toggleButtonStyle(viewMode === 'grid'),
                                        borderRadius: 'var(--radius, 8px) 0 0 var(--radius, 8px)',
                                        borderRight: 'none',
                                    }}
                                    aria-label="Grid view"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        ...toggleButtonStyle(viewMode === 'list'),
                                        borderRadius: '0 var(--radius, 8px) var(--radius, 8px) 0',
                                    }}
                                    aria-label="List view"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as SortOption)}
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
                        {viewMode === 'grid' ? (
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
                        ) : (
                            <div className="flex flex-col gap-3">
                                {visibleProducts.map((product, index) => (
                                    <ScrollAnimation key={product.id} delay={index * 40}>
                                        <ListCard
                                            product={product}
                                            shopSlug={shopSlug ?? ''}
                                            currencySymbol={currencySymbol ?? '\u20A6'}
                                            currencyDecimals={currencyDecimals ?? 2}
                                        />
                                    </ScrollAnimation>
                                ))}
                            </div>
                        )}

                        {hasMore && (
                            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                <button
                                    onClick={() => setVisibleCount((prev) => prev + productsPerPage)}
                                    style={{
                                        padding: '12px 32px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius, 8px)',
                                        border: '1px solid var(--color-border, #e5e7eb)',
                                        backgroundColor: 'var(--color-card-bg, #ffffff)',
                                        color: 'var(--color-foreground, #111827)',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-body, inherit)',
                                        transition: 'border-color 0.2s ease',
                                    }}
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
