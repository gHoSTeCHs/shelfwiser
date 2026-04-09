import { useState } from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

function SectionHeading({ heading, subheading }: { heading?: string; subheading?: string }) {
    if (!heading && !subheading) return null;
    return (
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
                            letterSpacing: '0.01em',
                        }}
                    >
                        {subheading}
                    </p>
                )}
            </div>
        </ScrollAnimation>
    );
}

function OverlayCard({ category, shopSlug, index }: { category: CategoryData; shopSlug?: string; index: number }) {
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
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 'var(--radius, 8px)',
                    textDecoration: 'none',
                    color: 'inherit',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div
                    style={{
                        position: 'relative',
                        paddingBottom: '80%',
                        overflow: 'hidden',
                    }}
                >
                    {/* Image or gradient mesh fallback */}
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
                                transform: hovered ? 'scale(1.08)' : 'scale(1)',
                                transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `
                                    radial-gradient(ellipse 70% 60% at 30% 70%, var(--color-primary, #047857) 0%, transparent 55%),
                                    radial-gradient(ellipse 50% 50% at 80% 30%, var(--color-secondary, #064E3B) 0%, transparent 50%),
                                    linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)
                                `,
                            }}
                        />
                    )}

                    {/* Multi-stop gradient overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(
                                to bottom,
                                rgba(0,0,0,0.05) 0%,
                                rgba(0,0,0,0.02) 30%,
                                rgba(0,0,0,0.25) 55%,
                                rgba(0,0,0,0.7) 100%
                            )`,
                            opacity: hovered ? 0.85 : 1,
                            transition: 'opacity 0.4s ease',
                        }}
                    />

                    {/* Noise texture */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                            backgroundSize: '128px 128px',
                        }}
                    />

                    {/* Content */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '20px 24px',
                            transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                            transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                color: '#ffffff',
                                fontFamily: 'var(--font-heading, inherit)',
                            }}
                        >
                            {category.name}
                        </h3>

                        <div
                            className="flex items-center gap-3"
                            style={{ marginTop: 8 }}
                        >
                            {(category.product_count ?? 0) > 0 && (
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.85)',
                                        fontFamily: 'var(--font-body, inherit)',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {category.product_count} product{(category.product_count ?? 0) !== 1 ? 's' : ''}
                                </span>
                            )}

                            {/* Hover arrow */}
                            <span
                                className="flex items-center gap-1"
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#fff',
                                    opacity: hovered ? 1 : 0,
                                    transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
                                    transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Shop
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </a>
        </ScrollAnimation>
    );
}

export function ImageOverlay({ config, data }: SectionProps) {
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
                <SectionHeading heading={heading} subheading={subheading} />

                <div className={`grid ${gridColsClass} gap-4 sm:gap-5`}>
                    {categories.map((category, index) => (
                        <OverlayCard
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
