import React from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

interface CategoryGridData {
    categories?: CategoryData[];
}

export function Chips({ config, data }: SectionProps) {
    const gridData = data as unknown as CategoryGridData;
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;

    if (categories.length === 0) {
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
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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

                <ScrollAnimation>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '10px',
                        }}
                    >
                        {categories.map((category) => {
                            const categoryUrl = shopSlug
                                ? `/store/${shopSlug}/products?category=${category.slug}`
                                : '#';

                            return (
                                <a
                                    key={category.id}
                                    href={categoryUrl}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        borderRadius: '999px',
                                        border: '1px solid var(--color-border, #e5e7eb)',
                                        backgroundColor: 'var(--color-card-bg, #ffffff)',
                                        color: 'var(--color-foreground, #111827)',
                                        textDecoration: 'none',
                                        transition:
                                            'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                                        fontFamily: 'var(--font-body, inherit)',
                                        whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        el.style.backgroundColor =
                                            'var(--color-primary, #6366f1)';
                                        el.style.borderColor = 'var(--color-primary, #6366f1)';
                                        el.style.color =
                                            'var(--color-button-foreground, #ffffff)';
                                    }}
                                    onMouseLeave={(e) => {
                                        const el = e.currentTarget;
                                        el.style.backgroundColor =
                                            'var(--color-card-bg, #ffffff)';
                                        el.style.borderColor =
                                            'var(--color-border, #e5e7eb)';
                                        el.style.color =
                                            'var(--color-foreground, #111827)';
                                    }}
                                >
                                    {category.name}
                                    {(category.product_count ?? 0) > 0 && (
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                opacity: 0.7,
                                            }}
                                        >
                                            ({category.product_count ?? 0})
                                        </span>
                                    )}
                                </a>
                            );
                        })}
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
