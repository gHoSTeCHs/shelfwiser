import React from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

export function ImageOverlay({ config, data }: SectionProps) {
    const gridData = narrowData<CategoryGridData>(data);
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const columns = (config.columns as number) ?? 3;

    if (categories.length === 0) {
        return null;
    }

    const gridColsClass =
        columns === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : columns === 4
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

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
                                        display: 'block',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: 'var(--radius, 8px)',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                    className="group"
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            paddingBottom: '75%',
                                            backgroundColor: 'var(--color-surface, #f3f4f6)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {category.image ? (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                loading="lazy"
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.5s ease',
                                                }}
                                                className="group-hover:scale-110"
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-muted, #9ca3af)',
                                                }}
                                            >
                                                <svg
                                                    width="48"
                                                    height="48"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1"
                                                >
                                                    <path d="M3 3h7l2 3h9v13H3z" />
                                                </svg>
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background:
                                                    'linear-gradient(transparent 40%, rgba(0,0,0,0.65))',
                                            }}
                                        />

                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: '16px 20px',
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                                    fontWeight: 600,
                                                    color: '#ffffff',
                                                    fontFamily: 'var(--font-heading, inherit)',
                                                }}
                                            >
                                                {category.name}
                                            </h3>
                                            {(category.product_count ?? 0) > 0 && (
                                                <p
                                                    style={{
                                                        marginTop: '4px',
                                                        fontSize: '13px',
                                                        color: 'rgba(255,255,255,0.8)',
                                                        fontFamily: 'var(--font-body, inherit)',
                                                    }}
                                                >
                                                    {category.product_count ?? 0} product
                                                    {(category.product_count ?? 0) !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
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
