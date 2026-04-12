import { useState } from 'react';
import type { SectionProps, CategoryData } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { narrowData } from '../../lib/section-helpers';

interface CategoryGridData {
    categories?: CategoryData[];
}

function ChipItem({ category, shopSlug, index }: { category: CategoryData; shopSlug?: string; index: number }) {
    const [hovered, setHovered] = useState(false);
    const categoryUrl = shopSlug
        ? `/store/${shopSlug}/products?category=${category.slug}`
        : '#';

    return (
        <a
            href={categoryUrl}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: category.image ? '6px 18px 6px 6px' : '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 999,
                border: hovered
                    ? '1.5px solid var(--color-primary, #e94560)'
                    : '1.5px solid var(--color-border, #e5e7eb)',
                backgroundColor: hovered
                    ? 'color-mix(in srgb, var(--color-primary, #e94560) 8%, var(--color-card-bg, #fff))'
                    : 'var(--color-card-bg, #ffffff)',
                color: hovered
                    ? 'var(--color-primary, #e94560)'
                    : 'var(--color-foreground, #111827)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body, inherit)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered
                    ? '0 4px 12px -4px color-mix(in srgb, var(--color-primary, #e94560) 25%, transparent)'
                    : '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                opacity: 0,
                animation: `chipFadeIn 0.4s ease forwards`,
                animationDelay: `${index * 50}ms`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Thumbnail inside chip */}
            {category.image && (
                <span
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--color-border, #e5e7eb)',
                    }}
                >
                    <img
                        src={category.image}
                        alt=""
                        loading="lazy"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </span>
            )}

            {category.name}

            {(category.product_count ?? 0) > 0 && (
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: hovered
                            ? 'var(--color-primary, #e94560)'
                            : 'var(--color-muted-foreground, #9ca3af)',
                        backgroundColor: hovered
                            ? 'color-mix(in srgb, var(--color-primary, #e94560) 12%, transparent)'
                            : 'var(--color-surface, #f3f4f6)',
                        borderRadius: 999,
                        padding: '2px 7px',
                        lineHeight: '16px',
                        transition: 'color 0.3s ease, background-color 0.3s ease',
                    }}
                >
                    {category.product_count}
                </span>
            )}
        </a>
    );
}

export function Chips({ config, data }: SectionProps) {
    const gridData = narrowData<CategoryGridData>(data);
    const categories = gridData.categories ?? [];
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const shopSlug = config.shop_slug as string | undefined;

    if (categories.length === 0) return null;

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            {/* Keyframes for staggered entrance */}
            <style>{`
                @keyframes chipFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {(heading || subheading) && (
                    <ScrollAnimation>
                        <div style={{ textAlign: 'center', marginBottom: 36 }}>
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

                <ScrollAnimation>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 10,
                        }}
                    >
                        {categories.map((category, index) => (
                            <ChipItem
                                key={category.id}
                                category={category}
                                shopSlug={shopSlug}
                                index={index}
                            />
                        ))}
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
