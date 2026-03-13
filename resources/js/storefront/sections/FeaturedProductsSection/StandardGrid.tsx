import React from 'react';
import type { SectionProps, ProductCardData } from '../../types/storefront';
import { ProductCard } from '../../components/ProductCard';
import { ScrollAnimation } from '../../components/ScrollAnimation';

interface FeaturedData {
    products?: ProductCardData[];
    title?: string;
    subtitle?: string;
}

export function StandardGrid({ config, data }: SectionProps) {
    const featuredData = data as unknown as FeaturedData;
    const products = featuredData.products ?? [];
    const heading = (config.heading as string) || featuredData.title;
    const subheading = (config.subheading as string) || featuredData.subtitle;
    const shopSlug = config.shop_slug as string | undefined;
    const currencySymbol = config.currency_symbol as string | undefined;
    const currencyDecimals = config.currency_decimals as number | undefined;

    if (products.length === 0) {
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

                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product, index) => (
                        <ScrollAnimation key={product.id} delay={index * 50}>
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
