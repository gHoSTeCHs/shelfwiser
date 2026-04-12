import { useState } from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

function IconCard({ category, shopSlug, index }: { category: CategoryData; shopSlug?: string; index: number }) {
    const [hovered, setHovered] = useState(false);
    const categoryUrl = shopSlug
        ? `/store/${shopSlug}/products?category=${category.slug}`
        : '#';

    return (
        <ScrollAnimation delay={index * 60}>
            <a
                href={categoryUrl}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                    padding: '28px 16px 24px',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderRadius: 'var(--radius, 8px)',
                    backgroundColor: hovered ? 'var(--color-card-bg, #ffffff)' : 'transparent',
                    boxShadow: hovered
                        ? '0 8px 24px -6px rgba(0,0,0,0.1), 0 2px 6px -2px rgba(0,0,0,0.05)'
                        : '0 0 0 0 transparent',
                    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                    transition: 'background-color 0.3s ease, box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Circle icon */}
                <div
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: hovered
                            ? '2px solid var(--color-primary, #e94560)'
                            : '2px solid var(--color-border, #e5e7eb)',
                        backgroundColor: hovered
                            ? 'color-mix(in srgb, var(--color-primary, #e94560) 8%, var(--color-card-bg, #fff))'
                            : 'var(--color-surface, #f3f4f6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'border-color 0.3s ease, background-color 0.3s ease, transform 0.3s ease',
                        transform: hovered ? 'scale(1.06)' : 'scale(1)',
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
                                fontSize: 28,
                                fontWeight: 800,
                                fontFamily: 'var(--font-heading, inherit)',
                                color: hovered
                                    ? 'var(--color-primary, #e94560)'
                                    : 'var(--color-muted-foreground, #9ca3af)',
                                lineHeight: 1,
                                textTransform: 'uppercase',
                                letterSpacing: '-0.03em',
                                transition: 'color 0.3s ease',
                            }}
                        >
                            {category.name.charAt(0)}
                        </span>
                    )}
                </div>

                {/* Text */}
                <div style={{ textAlign: 'center', minWidth: 0, maxWidth: '100%' }}>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            color: hovered ? 'var(--color-primary, #e94560)' : 'var(--color-foreground, #111827)',
                            fontFamily: 'var(--font-heading, inherit)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.3s ease',
                        }}
                    >
                        {category.name}
                    </h3>
                    {(category.product_count ?? 0) > 0 && (
                        <p
                            style={{
                                marginTop: 3,
                                fontSize: 12,
                                color: 'var(--color-muted-foreground, #6b7280)',
                                fontFamily: 'var(--font-body, inherit)',
                            }}
                        >
                            {category.product_count} item{(category.product_count ?? 0) !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </a>
        </ScrollAnimation>
    );
}

export function IconGrid({ config, data }: SectionProps) {
    const gridData = narrowData<CategoryGridData>(data);
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const columns = (config.columns as number) ?? 4;

    if (categories.length === 0) return null;

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
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {(heading || subheading) && (
                    <ScrollAnimation>
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
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

                <div className={`grid ${gridColsClass} gap-2 sm:gap-3`}>
                    {categories.map((category, index) => (
                        <IconCard
                            key={category.id}
                            category={category}
                            shopSlug={shopSlug}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
