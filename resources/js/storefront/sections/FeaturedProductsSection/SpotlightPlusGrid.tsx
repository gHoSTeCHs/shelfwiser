import { useState } from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { formatCurrency } from '../../lib/formatters';
import { narrowData } from '../../lib/section-helpers';

interface FeaturedData {
    products?: ProductCardData[];
    title?: string;
    subtitle?: string;
}

function SpotlightCard({
    product,
    shopSlug,
    currencySymbol,
    currencyDecimals,
}: {
    product: ProductCardData;
    shopSlug?: string;
    currencySymbol: string;
    currencyDecimals: number;
}) {
    const [hovered, setHovered] = useState(false);
    const spotlightUrl = shopSlug ? `/store/${shopSlug}/products/${product.slug}` : '#';
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

    return (
        <a
            href={spotlightUrl}
            style={{
                display: 'block',
                height: '100%',
                textDecoration: 'none',
                color: 'inherit',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <article
                style={{
                    position: 'relative',
                    height: '100%',
                    minHeight: 420,
                    overflow: 'hidden',
                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                    backgroundColor: 'var(--color-surface, #f3f4f6)',
                }}
            >
                {/* Image */}
                <div style={{ position: 'absolute', inset: 0 }}>
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: hovered ? 'scale(1.04)' : 'scale(1)',
                                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'var(--color-primary, #e94560)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 80,
                                    fontWeight: 800,
                                    color: 'rgba(255,255,255,0.15)',
                                    fontFamily: 'var(--font-heading, inherit)',
                                    letterSpacing: '-0.04em',
                                }}
                            >
                                {product.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.75) 100%)',
                    }}
                />

                {/* Badges */}
                <div
                    style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        display: 'flex',
                        gap: 8,
                    }}
                >
                    {product.is_new && (
                        <span
                            style={{
                                padding: '5px 14px',
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                borderRadius: 'var(--radius, 8px)',
                                backgroundColor: 'var(--color-primary, #e94560)',
                                color: '#fff',
                            }}
                        >
                            New
                        </span>
                    )}
                    {hasDiscount && (
                        <span
                            style={{
                                padding: '5px 14px',
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                borderRadius: 'var(--radius, 8px)',
                                backgroundColor: 'var(--color-accent, #f59e0b)',
                                color: '#fff',
                            }}
                        >
                            Sale
                        </span>
                    )}
                </div>

                {/* Content */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '36px 28px 28px',
                    }}
                >
                    {product.category_name && (
                        <p
                            style={{
                                marginBottom: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'rgba(255,255,255,0.65)',
                                fontFamily: 'var(--font-body, inherit)',
                            }}
                        >
                            {product.category_name}
                        </p>
                    )}
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 'clamp(1.3rem, 2.5vw, 1.6rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            color: '#ffffff',
                            fontFamily: 'var(--font-heading, inherit)',
                        }}
                    >
                        {product.name}
                    </h3>
                    <div
                        style={{
                            marginTop: 10,
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 10,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '1.3rem',
                                fontWeight: 800,
                                color: '#ffffff',
                                fontFamily: 'var(--font-body, inherit)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {formatCurrency(product.price, currencySymbol, currencyDecimals)}
                        </span>
                        {hasDiscount && (
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.5)',
                                    textDecoration: 'line-through',
                                }}
                            >
                                {formatCurrency(product.compare_at_price!, currencySymbol, currencyDecimals)}
                            </span>
                        )}
                    </div>

                    {/* "Shop now" text that appears on hover */}
                    <p
                        style={{
                            marginTop: 12,
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#fff',
                            opacity: hovered ? 0.8 : 0,
                            transform: hovered ? 'translateY(0)' : 'translateY(6px)',
                            transition: 'opacity 0.3s ease, transform 0.3s ease',
                            fontFamily: 'var(--font-body, inherit)',
                        }}
                    >
                        View product
                    </p>
                </div>
            </article>
        </a>
    );
}

export function SpotlightPlusGrid({ config, data }: SectionProps) {
    const featuredData = narrowData<FeaturedData>(data);
    const products = featuredData.products ?? [];
    const heading = (config.heading as string) || featuredData.title;
    const subheading = (config.subheading as string) || featuredData.subtitle;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = (config.currency_symbol as string) ?? '\u20A6';
    const currencyDecimals = (config.currency_decimals as number) ?? 2;

    if (products.length === 0) return null;

    const spotlightProduct = products[0];
    const gridProducts = products.slice(1);

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

                <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
                    <ScrollAnimation className="col-span-2 row-span-2">
                        <SpotlightCard
                            product={spotlightProduct}
                            shopSlug={shopSlug}
                            currencySymbol={currencySymbol}
                            currencyDecimals={currencyDecimals}
                        />
                    </ScrollAnimation>

                    {gridProducts.map((product, index) => (
                        <ScrollAnimation key={product.id} delay={(index + 1) * 75}>
                            <ProductCard
                                product={product}
                                shopSlug={shopSlug ?? ''}
                                currencySymbol={currencySymbol}
                                currencyDecimals={currencyDecimals}
                            />
                        </ScrollAnimation>
                    ))}
                </div>
            </div>
        </section>
    );
}
