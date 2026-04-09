import { useState } from 'react';

interface CollectionItem {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    product_count: number;
    description?: string;
}

interface AccordionProps {
    collections: CollectionItem[];
    shop_slug: string;
}

function AccordionRow({
    collection,
    shopSlug,
    isOpen,
    isLast,
    onToggle,
}: {
    collection: CollectionItem;
    shopSlug: string;
    isOpen: boolean;
    isLast: boolean;
    onToggle: () => void;
}) {
    const [rowHovered, setRowHovered] = useState(false);
    const [ctaHovered, setCtaHovered] = useState(false);

    return (
        <div
            style={{
                borderBottom: isLast ? 'none' : '1px solid var(--color-border, #e5e5e5)',
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-5 p-5 text-left sm:gap-6 sm:px-7"
                style={{
                    backgroundColor: isOpen
                        ? 'var(--color-surface, #f9fafb)'
                        : rowHovered
                          ? 'var(--color-surface, #f9fafb)'
                          : 'transparent',
                    transition: 'background-color 0.25s ease',
                    border: 'none',
                    cursor: 'pointer',
                }}
                onMouseEnter={() => setRowHovered(true)}
                onMouseLeave={() => setRowHovered(false)}
                aria-expanded={isOpen}
            >
                {/* Thumbnail */}
                <div
                    className="shrink-0 overflow-hidden"
                    style={{
                        width: 56,
                        height: 56,
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
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <span
                                style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: 'var(--color-primary, #e94560)',
                                    opacity: 0.2,
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

                {/* Title + count */}
                <div className="min-w-0 flex-1">
                    <h3
                        className="truncate"
                        style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            color: isOpen ? 'var(--color-primary, #e94560)' : 'var(--color-foreground, #1a1a1a)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                            transition: 'color 0.25s ease',
                        }}
                    >
                        {collection.name}
                    </h3>
                    <p
                        className="mt-1 text-xs"
                        style={{
                            color: 'var(--color-muted-foreground, #6b7280)',
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        {collection.product_count} {collection.product_count === 1 ? 'item' : 'items'}
                    </p>
                </div>

                {/* Chevron */}
                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{
                        borderRadius: '50%',
                        backgroundColor: isOpen
                            ? 'var(--color-primary, #e94560)'
                            : 'var(--color-border, #f0f0f0)',
                        color: isOpen ? '#fff' : 'var(--color-muted-foreground, #6b7280)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.25s ease, color 0.25s ease',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
                <div
                    className="px-5 pb-6 sm:px-7 sm:pb-7"
                    style={{
                        backgroundColor: 'var(--color-surface, #f9fafb)',
                    }}
                >
                    <div className="ml-[76px] sm:ml-[80px]">
                        {collection.description && (
                            <p
                                className="mb-5 text-sm"
                                style={{
                                    color: 'var(--color-text, #4b5563)',
                                    fontFamily: 'var(--font-body, sans-serif)',
                                    lineHeight: 1.7,
                                    maxWidth: '60ch',
                                }}
                            >
                                {collection.description}
                            </p>
                        )}

                        <a
                            href={`/store/${shopSlug}/collections/${collection.slug}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase"
                            style={{
                                backgroundColor: ctaHovered
                                    ? 'var(--color-foreground, #111)'
                                    : 'var(--color-primary, #e94560)',
                                color: '#fff',
                                borderRadius: 'var(--radius, 8px)',
                                letterSpacing: '0.06em',
                                textDecoration: 'none',
                                fontFamily: 'var(--font-body, sans-serif)',
                                transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={() => setCtaHovered(true)}
                            onMouseLeave={() => setCtaHovered(false)}
                        >
                            View Collection
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export function Accordion({ collections, shop_slug }: AccordionProps) {
    const [openId, setOpenId] = useState<number | null>(null);

    return (
        <div
            className="overflow-hidden"
            style={{
                borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                border: '1px solid var(--color-border, #e5e5e5)',
                backgroundColor: 'var(--color-card-bg, #ffffff)',
            }}
        >
            {collections.map((collection, index) => (
                <AccordionRow
                    key={collection.id}
                    collection={collection}
                    shopSlug={shop_slug}
                    isOpen={openId === collection.id}
                    isLast={index === collections.length - 1}
                    onToggle={() => setOpenId((prev) => (prev === collection.id ? null : collection.id))}
                />
            ))}
        </div>
    );
}
