import { useMemo, useState } from 'react';
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

export function SidebarFilters({ config, data }: SectionProps) {
    const gridData = narrowData<GridData>(data);
    const allProducts = gridData.products ?? [];
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = config.currency_symbol as string | undefined;
    const currencyDecimals = config.currency_decimals as number | undefined;
    const productsPerPage = (config.products_per_page as number) ?? 12;

    const [sort, setSort] = useState<SortOption>('newest');
    const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [visibleCount, setVisibleCount] = useState(productsPerPage);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const toggleCategory = (id: number) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
        setVisibleCount(productsPerPage);
    };

    const filteredProducts = useMemo(() => {
        let products = [...allProducts];

        if (selectedCategories.size > 0) {
            products = products.filter(
                (p) =>
                    p.category_name &&
                    categories.some(
                        (c) => selectedCategories.has(c.id) && c.name === p.category_name
                    )
            );
        }

        const minPrice = priceMin ? parseFloat(priceMin) : null;
        const maxPrice = priceMax ? parseFloat(priceMax) : null;
        if (minPrice !== null && !isNaN(minPrice)) {
            products = products.filter((p) => p.price >= minPrice);
        }
        if (maxPrice !== null && !isNaN(maxPrice)) {
            products = products.filter((p) => p.price <= maxPrice);
        }

        return sortProducts(products, sort);
    }, [allProducts, selectedCategories, priceMin, priceMax, sort, categories]);

    const visibleProducts = filteredProducts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredProducts.length;
    const activeFilterCount =
        selectedCategories.size + (priceMin ? 1 : 0) + (priceMax ? 1 : 0);

    const clearFilters = () => {
        setSelectedCategories(new Set());
        setPriceMin('');
        setPriceMax('');
        setVisibleCount(productsPerPage);
    };

    const filterPanel = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {categories.length > 0 && (
                <div>
                    <h3
                        style={{
                            margin: '0 0 12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--color-foreground, #111827)',
                            fontFamily: 'var(--font-heading, inherit)',
                        }}
                    >
                        Categories
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categories.map((cat) => (
                            <label
                                key={cat.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: 'var(--color-foreground, #111827)',
                                    fontFamily: 'var(--font-body, inherit)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.has(cat.id)}
                                    onChange={() => toggleCategory(cat.id)}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: 'var(--color-primary, #e94560)',
                                        cursor: 'pointer',
                                    }}
                                />
                                {cat.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3
                    style={{
                        margin: '0 0 12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--color-foreground, #111827)',
                        fontFamily: 'var(--font-heading, inherit)',
                    }}
                >
                    Price Range
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => {
                            setPriceMin(e.target.value);
                            setVisibleCount(productsPerPage);
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '14px',
                            borderRadius: 'var(--radius, 8px)',
                            border: '1px solid var(--color-border, #e5e7eb)',
                            backgroundColor: 'var(--color-card-bg, #ffffff)',
                            color: 'var(--color-foreground, #111827)',
                            fontFamily: 'var(--font-body, inherit)',
                        }}
                    />
                    <span
                        style={{
                            fontSize: '14px',
                            color: 'var(--color-muted-foreground, #6b7280)',
                        }}
                    >
                        -
                    </span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => {
                            setPriceMax(e.target.value);
                            setVisibleCount(productsPerPage);
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '14px',
                            borderRadius: 'var(--radius, 8px)',
                            border: '1px solid var(--color-border, #e5e7eb)',
                            backgroundColor: 'var(--color-card-bg, #ffffff)',
                            color: 'var(--color-foreground, #111827)',
                            fontFamily: 'var(--font-body, inherit)',
                        }}
                    />
                </div>
            </div>

            {activeFilterCount > 0 && (
                <button
                    onClick={clearFilters}
                    style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: 'var(--radius, 8px)',
                        border: '1px solid var(--color-border, #e5e7eb)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-muted-foreground, #6b7280)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body, inherit)',
                    }}
                >
                    Clear all filters
                </button>
            )}
        </div>
    );

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                            <span
                                style={{
                                    fontSize: '14px',
                                    color: 'var(--color-muted-foreground, #6b7280)',
                                    fontFamily: 'var(--font-body, inherit)',
                                }}
                            >
                                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                                className="sm:hidden"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 14px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    borderRadius: 'var(--radius, 8px)',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    color: 'var(--color-foreground, #111827)',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body, inherit)',
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="4" y1="21" x2="4" y2="14" />
                                    <line x1="4" y1="10" x2="4" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12" y2="3" />
                                    <line x1="20" y1="21" x2="20" y2="16" />
                                    <line x1="20" y1="12" x2="20" y2="3" />
                                    <line x1="1" y1="14" x2="7" y2="14" />
                                    <line x1="9" y1="8" x2="15" y2="8" />
                                    <line x1="17" y1="16" x2="23" y2="16" />
                                </svg>
                                Filters
                                {activeFilterCount > 0 && (
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '20px',
                                            height: '20px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-primary, #e94560)',
                                            color: '#fff',
                                        }}
                                    >
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

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
                </ScrollAnimation>

                {mobileFiltersOpen && (
                    <div
                        className="sm:hidden"
                        style={{
                            marginBottom: '24px',
                            padding: '20px',
                            borderRadius: 'var(--radius, 8px)',
                            border: '1px solid var(--color-border, #e5e7eb)',
                            backgroundColor: 'var(--color-card-bg, #ffffff)',
                        }}
                    >
                        {filterPanel}
                    </div>
                )}

                <div className="flex gap-8">
                    <aside
                        className="hidden sm:block"
                        style={{
                            flex: '0 0 240px',
                            position: 'sticky',
                            top: '24px',
                            alignSelf: 'flex-start',
                        }}
                    >
                        {filterPanel}
                    </aside>

                    <div style={{ flex: 1, minWidth: 0 }}>
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
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <p style={{ fontSize: '16px', fontWeight: 500 }}>
                                    No products match your filters
                                </p>
                                <button
                                    onClick={clearFilters}
                                    style={{
                                        marginTop: '12px',
                                        padding: '8px 20px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        border: 'none',
                                        borderRadius: 'var(--radius, 8px)',
                                        backgroundColor: 'var(--color-primary, #e94560)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-body, inherit)',
                                    }}
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
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
                                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                        <button
                                            onClick={() =>
                                                setVisibleCount((prev) => prev + productsPerPage)
                                            }
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
                </div>
            </div>
        </section>
    );
}
