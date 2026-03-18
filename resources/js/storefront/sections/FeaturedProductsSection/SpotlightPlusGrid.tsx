import React from 'react';
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

export function SpotlightPlusGrid({ config, data }: SectionProps) {
    const featuredData = narrowData<FeaturedData>(data);
    const products = featuredData.products ?? [];
    const heading = (config.heading as string) || featuredData.title;
    const subheading = (config.subheading as string) || featuredData.subtitle;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = (config.currency_symbol as string) ?? '\u20A6';
    const currencyDecimals = (config.currency_decimals as number) ?? 2;

    if (products.length === 0) {
        return null;
    }

    const spotlightProduct = products[0];
    const gridProducts = products.slice(1);
    const spotlightUrl = shopSlug ? `/store/${shopSlug}/products/${spotlightProduct.slug}` : '#';

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

                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                    <ScrollAnimation className="col-span-2 row-span-2">
                        <a
                            href={spotlightUrl}
                            style={{
                                display: 'block',
                                height: '100%',
                                textDecoration: 'none',
                                color: 'inherit',
                            }}
                        >
                            <article
                                style={{
                                    position: 'relative',
                                    height: '100%',
                                    minHeight: '400px',
                                    overflow: 'hidden',
                                    borderRadius: 'var(--radius, 8px)',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'var(--color-surface, #f3f4f6)',
                                    }}
                                >
                                    {spotlightProduct.image ? (
                                        <img
                                            src={spotlightProduct.image}
                                            alt={spotlightProduct.name}
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
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
                                                color: 'var(--color-muted, #9ca3af)',
                                            }}
                                        >
                                            <svg
                                                width="64"
                                                height="64"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1"
                                            >
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '32px 24px 24px',
                                        background:
                                            'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                    }}
                                >
                                    {spotlightProduct.category_name && (
                                        <p
                                            style={{
                                                marginBottom: '4px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                color: 'rgba(255,255,255,0.8)',
                                                fontFamily: 'var(--font-body, inherit)',
                                            }}
                                        >
                                            {spotlightProduct.category_name}
                                        </p>
                                    )}
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                                            fontWeight: 700,
                                            color: '#ffffff',
                                            fontFamily: 'var(--font-heading, inherit)',
                                        }}
                                    >
                                        {spotlightProduct.name}
                                    </h3>
                                    <div
                                        style={{
                                            marginTop: '8px',
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: '8px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 700,
                                                color: '#ffffff',
                                                fontFamily: 'var(--font-body, inherit)',
                                            }}
                                        >
                                            {formatCurrency(
                                                spotlightProduct.price,
                                                currencySymbol,
                                                currencyDecimals
                                            )}
                                        </span>
                                        {spotlightProduct.compare_at_price &&
                                            spotlightProduct.compare_at_price >
                                                spotlightProduct.price && (
                                                <span
                                                    style={{
                                                        fontSize: '14px',
                                                        color: 'rgba(255,255,255,0.6)',
                                                        textDecoration: 'line-through',
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        spotlightProduct.compare_at_price,
                                                        currencySymbol,
                                                        currencyDecimals
                                                    )}
                                                </span>
                                            )}
                                    </div>
                                </div>

                                {spotlightProduct.is_new && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '12px',
                                            padding: '4px 12px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            borderRadius: 'var(--radius, 8px)',
                                            backgroundColor: 'var(--color-accent, #f59e0b)',
                                            color: 'var(--color-accent-foreground, #ffffff)',
                                        }}
                                    >
                                        New
                                    </span>
                                )}
                            </article>
                        </a>
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
