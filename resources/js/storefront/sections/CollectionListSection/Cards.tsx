import { useId, useState } from 'react';

interface CollectionItem {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    product_count: number;
    description?: string;
}

interface CardsProps {
    collections: CollectionItem[];
    shop_slug: string;
}

function CollectionCard({ collection, shopSlug }: { collection: CollectionItem; shopSlug: string }) {
    const [hovered, setHovered] = useState(false);

    return (
        <a
            href={`/store/${shopSlug}/collections/${collection.slug}`}
            className="block overflow-hidden"
            style={{
                borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                border: hovered
                    ? '1px solid var(--color-primary, #e94560)'
                    : '1px solid var(--color-border, #e5e5e5)',
                backgroundColor: 'var(--color-card-bg, #ffffff)',
                boxShadow: hovered
                    ? '0 12px 32px -8px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.05)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image */}
            <div
                className="relative overflow-hidden"
                style={{
                    aspectRatio: '16/10',
                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                }}
            >
                {collection.image ? (
                    <img
                        src={collection.image}
                        alt={collection.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        style={{
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <span
                            style={{
                                fontSize: 72,
                                fontWeight: 800,
                                color: 'var(--color-primary, #e94560)',
                                opacity: 0.1,
                                fontFamily: 'var(--font-heading, sans-serif)',
                                letterSpacing: '-0.04em',
                                lineHeight: 1,
                            }}
                        >
                            {collection.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Product count badge */}
                <span
                    className="absolute flex items-center gap-1.5 px-3 py-1.5"
                    style={{
                        top: 14,
                        left: 14,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--color-foreground, #111)',
                        fontFamily: 'var(--font-body, sans-serif)',
                        letterSpacing: '0.03em',
                    }}
                >
                    {collection.product_count} {collection.product_count === 1 ? 'item' : 'items'}
                </span>
            </div>

            {/* Content */}
            <div className="flex items-center justify-between p-5">
                <div className="min-w-0 flex-1">
                    <h3
                        className="truncate text-[17px]"
                        style={{
                            margin: 0,
                            fontWeight: 700,
                            letterSpacing: '-0.015em',
                            color: hovered ? 'var(--color-primary, #e94560)' : 'var(--color-foreground, #1a1a1a)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                            transition: 'color 0.3s ease',
                        }}
                    >
                        {collection.name}
                    </h3>
                    {collection.description && (
                        <p
                            className="mt-1 line-clamp-1 text-xs"
                            style={{
                                color: 'var(--color-muted-foreground, #6b7280)',
                                fontFamily: 'var(--font-body, sans-serif)',
                            }}
                        >
                            {collection.description}
                        </p>
                    )}
                </div>

                {/* Arrow */}
                <span
                    className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{
                        borderRadius: '50%',
                        backgroundColor: hovered
                            ? 'var(--color-primary, #e94560)'
                            : 'var(--color-surface, #f5f5f5)',
                        color: hovered ? '#fff' : 'var(--color-muted-foreground, #6b7280)',
                        transition: 'background-color 0.3s ease, color 0.3s ease',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </span>
            </div>
        </a>
    );
}

export function Cards({ collections, shop_slug }: CardsProps) {
    const gridId = useId().replace(/:/g, '');

    return (
        <>
            <style>{`
                #collection-grid-${gridId} {
                    display: grid;
                    gap: 1.25rem;
                    grid-template-columns: repeat(1, 1fr);
                }
                @media (min-width: 640px) {
                    #collection-grid-${gridId} { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 1024px) {
                    #collection-grid-${gridId} { grid-template-columns: repeat(3, 1fr); }
                }
            `}</style>
            <div id={`collection-grid-${gridId}`}>
                {collections.map((collection) => (
                    <CollectionCard
                        key={collection.id}
                        collection={collection}
                        shopSlug={shop_slug}
                    />
                ))}
            </div>
        </>
    );
}
