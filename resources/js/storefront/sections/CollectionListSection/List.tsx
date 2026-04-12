import { useState } from 'react';

interface CollectionItem {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    product_count: number;
    description?: string;
}

interface ListProps {
    collections: CollectionItem[];
    shop_slug: string;
}

function ListRow({ collection, shopSlug }: { collection: CollectionItem; shopSlug: string }) {
    const [hovered, setHovered] = useState(false);

    return (
        <a
            href={`/store/${shopSlug}/collections/${collection.slug}`}
            className="flex items-center gap-5 p-5 sm:gap-6"
            style={{
                borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                border: hovered
                    ? '1px solid var(--color-primary, #e94560)'
                    : '1px solid var(--color-border, #e5e5e5)',
                backgroundColor: 'var(--color-card-bg, #ffffff)',
                boxShadow: hovered
                    ? '0 8px 24px -6px rgba(0,0,0,0.1)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image */}
            <div
                className="relative shrink-0 overflow-hidden"
                style={{
                    width: 88,
                    height: 88,
                    borderRadius: 'calc(var(--radius, 8px) * 1)',
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
                            transform: hovered ? 'scale(1.06)' : 'scale(1)',
                            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <span
                            style={{
                                fontSize: 34,
                                fontWeight: 800,
                                color: 'var(--color-primary, #e94560)',
                                opacity: 0.18,
                                fontFamily: 'var(--font-heading, sans-serif)',
                                letterSpacing: '-0.04em',
                                lineHeight: 1,
                            }}
                        >
                            {collection.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
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
                    <span
                        className="shrink-0 px-2 py-0.5 text-[10px] font-bold"
                        style={{
                            borderRadius: 999,
                            backgroundColor: 'var(--color-surface, #f5f5f5)',
                            color: 'var(--color-muted-foreground, #6b7280)',
                            fontFamily: 'var(--font-body, sans-serif)',
                            letterSpacing: '0.03em',
                        }}
                    >
                        {collection.product_count} {collection.product_count === 1 ? 'ITEM' : 'ITEMS'}
                    </span>
                </div>
                {collection.description && (
                    <p
                        className="mt-1 line-clamp-1 text-sm"
                        style={{
                            color: 'var(--color-muted-foreground, #6b7280)',
                            fontFamily: 'var(--font-body, sans-serif)',
                            lineHeight: 1.55,
                        }}
                    >
                        {collection.description}
                    </p>
                )}
            </div>

            {/* Arrow */}
            <span
                className="hidden h-10 w-10 shrink-0 items-center justify-center sm:flex"
                style={{
                    borderRadius: '50%',
                    backgroundColor: hovered
                        ? 'var(--color-primary, #e94560)'
                        : 'var(--color-surface, #f5f5f5)',
                    color: hovered ? '#fff' : 'var(--color-muted-foreground, #6b7280)',
                    transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                    transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                </svg>
            </span>
        </a>
    );
}

export function List({ collections, shop_slug }: ListProps) {
    return (
        <div className="flex flex-col gap-3">
            {collections.map((collection) => (
                <ListRow key={collection.id} collection={collection} shopSlug={shop_slug} />
            ))}
        </div>
    );
}
