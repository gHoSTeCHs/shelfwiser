import React from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

export function IconGrid({ config, data }: SectionProps) {
    const gridData = narrowData<CategoryGridData>(data);
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const columns = (config.columns as number) ?? 4;

    if (categories.length === 0) {
        return null;
    }

    const gridColsClass =
        columns === 2
            ? 'grid-cols-2 sm:grid-cols-2'
            : columns === 3
              ? 'grid-cols-2 sm:grid-cols-3'
              : columns === 6
                ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

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

                <div className={`grid ${gridColsClass} gap-4 sm:gap-6`}>
                    {categories.map((category, index) => {
                        const categoryUrl = shopSlug
                            ? `/store/${shopSlug}/products?category=${category.slug}`
                            : '#';

                        return (
                            <ScrollAnimation key={category.id} delay={index * 75}>
                                <a
                                    href={categoryUrl}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '24px 16px',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        borderRadius: 'var(--radius, 8px)',
                                        border: '1px solid var(--color-border, #e5e7eb)',
                                        backgroundColor: 'var(--color-card-bg, #ffffff)',
                                        transition:
                                            'border-color 0.2s ease, box-shadow 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        el.style.borderColor =
                                            'var(--color-primary, #6366f1)';
                                        el.style.boxShadow =
                                            '0 4px 12px rgba(0, 0, 0, 0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        const el = e.currentTarget;
                                        el.style.borderColor =
                                            'var(--color-border, #e5e7eb)';
                                        el.style.boxShadow = 'none';
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: 'var(--radius, 8px)',
                                            backgroundColor: 'var(--color-surface, #f3f4f6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {category.image ? (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                loading="lazy"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: '28px',
                                                    fontWeight: 700,
                                                    color: 'var(--color-primary, #6366f1)',
                                                    fontFamily: 'var(--font-heading, inherit)',
                                                    lineHeight: 1,
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {category.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'center', minWidth: 0 }}>
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: 'var(--color-foreground, #111827)',
                                                fontFamily: 'var(--font-heading, inherit)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {category.name}
                                        </h3>
                                        {(category.product_count ?? 0) > 0 && (
                                            <p
                                                style={{
                                                    marginTop: '2px',
                                                    fontSize: '12px',
                                                    color: 'var(--color-muted-foreground, #6b7280)',
                                                    fontFamily: 'var(--font-body, inherit)',
                                                }}
                                            >
                                                {category.product_count ?? 0} product
                                                {(category.product_count ?? 0) !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </a>
                            </ScrollAnimation>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
