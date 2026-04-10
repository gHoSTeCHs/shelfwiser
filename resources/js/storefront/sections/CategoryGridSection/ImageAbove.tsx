import { useState } from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

function ImageAboveCard({ category, shopSlug, index }: { category: CategoryData; shopSlug?: string; index: number }) {
    const [hovered, setHovered] = useState(false);
    const categoryUrl = shopSlug
        ? `/store/${shopSlug}/products?category=${category.slug}`
        : '#';

    return (
        <ScrollAnimation delay={index * 80}>
            <a
                href={categoryUrl}
                style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    overflow: 'hidden',
                    borderRadius: 'var(--radius, 8px)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                    boxShadow: hovered
                        ? '0 12px 32px -8px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                    borderColor: hovered ? 'var(--color-primary, #e94560)' : 'var(--color-border, #e5e7eb)',
                    transition: 'box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Image area */}
                <div
                    style={{
                        position: 'relative',
                        paddingBottom: '62%',
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
                                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `
                                    radial-gradient(ellipse 60% 60% at 40% 60%, color-mix(in srgb, var(--color-primary, #047857) 20%, transparent) 0%, transparent 60%),
                                    radial-gradient(ellipse 50% 50% at 70% 30%, color-mix(in srgb, var(--color-secondary, #064E3B) 15%, transparent) 0%, transparent 55%),
                                    var(--color-surface, #f3f4f6)
                                `,
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 42,
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-heading, inherit)',
                                        color: 'var(--color-primary, #047857)',
                                        opacity: 0.15,
                                        letterSpacing: '-0.04em',
                                    }}
                                >
                                    {category.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Subtle bottom fade for depth */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 32,
                            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.04))',
                            pointerEvents: 'none',
                        }}
                    />
                </div>

                {/* Content area */}
                <div style={{ padding: '16px 20px 18px' }}>
                    <div className="flex items-center justify-between gap-3">
                        <div style={{ minWidth: 0 }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    letterSpacing: '-0.01em',
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
                                        marginTop: 3,
                                        fontSize: 13,
                                        color: 'var(--color-muted-foreground, #6b7280)',
                                        fontFamily: 'var(--font-body, inherit)',
                                    }}
                                >
                                    {category.product_count} product{(category.product_count ?? 0) !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Arrow */}
                        <span
                            style={{
                                flexShrink: 0,
                                color: 'var(--color-primary, #e94560)',
                                opacity: hovered ? 1 : 0,
                                transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
                                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </span>
                    </div>
                </div>
            </a>
        </ScrollAnimation>
    );
}

export function ImageAbove({ config, data }: SectionProps) {
    const gridData = narrowData<CategoryGridData>(data);
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;
    const columns = (config.columns as number) ?? 3;

    if (categories.length === 0) return null;

    const gridColsClass =
        columns === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : columns === 4
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

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
                                        textTransform: 'var(--heading-transform, none)' as React.CSSProperties['textTransform'],
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

                <div className={`grid ${gridColsClass} gap-4 sm:gap-5`}>
                    {categories.map((category, index) => (
                        <ImageAboveCard
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
