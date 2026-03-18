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

export function Accordion({ collections, shop_slug }: AccordionProps) {
    const [openId, setOpenId] = useState<number | null>(null);

    function toggle(id: number) {
        setOpenId((prev) => (prev === id ? null : id));
    }

    return (
        <div
            className="overflow-hidden"
            style={{
                borderRadius: 'var(--radius, 8px)',
                border: '1px solid var(--color-border, #e5e5e5)',
            }}
        >
            {collections.map((collection, index) => {
                const isOpen = openId === collection.id;
                const isLast = index === collections.length - 1;

                return (
                    <div
                        key={collection.id}
                        style={{
                            borderBottom: isLast ? 'none' : '1px solid var(--color-border, #e5e5e5)',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => toggle(collection.id)}
                            className="flex w-full items-center gap-4 p-4 text-left transition-colors sm:gap-6"
                            style={{
                                backgroundColor: isOpen
                                    ? 'var(--color-surface, #f5f5f5)'
                                    : 'var(--color-background, #ffffff)',
                            }}
                            aria-expanded={isOpen}
                        >
                            <div
                                className="shrink-0 overflow-hidden"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'calc(var(--radius, 8px) * 0.75)',
                                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                                }}
                            >
                                {collection.image ? (
                                    <img
                                        src={collection.image}
                                        alt={collection.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="var(--color-text-muted, #ccc)"
                                            strokeWidth="1"
                                        >
                                            <rect x="3" y="3" width="7" height="7" />
                                            <rect x="14" y="3" width="7" height="7" />
                                            <rect x="3" y="14" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3
                                    className="text-base font-semibold"
                                    style={{
                                        color: 'var(--color-text, #1a1a1a)',
                                        fontFamily: 'var(--font-heading, sans-serif)',
                                    }}
                                >
                                    {collection.name}
                                </h3>
                                <p
                                    className="mt-0.5 text-xs"
                                    style={{
                                        color: 'var(--color-text-muted, #888)',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                    }}
                                >
                                    {collection.product_count} {collection.product_count === 1 ? 'product' : 'products'}
                                </p>
                            </div>

                            <div
                                className="shrink-0 transition-transform duration-200"
                                style={{
                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    color: 'var(--color-text-muted, #888)',
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div
                                className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6"
                                style={{
                                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                                }}
                            >
                                <div className="ml-12 sm:ml-[72px]">
                                    {collection.description && (
                                        <p
                                            className="mb-4 text-sm"
                                            style={{
                                                color: 'var(--color-text-muted, #666)',
                                                fontFamily: 'var(--font-body, sans-serif)',
                                            }}
                                        >
                                            {collection.description}
                                        </p>
                                    )}

                                    <a
                                        href={`/store/${shop_slug}/collections/${collection.slug}`}
                                        className="inline-flex items-center text-sm font-medium transition-opacity hover:opacity-80"
                                        style={{
                                            color: 'var(--color-primary, #1a1a1a)',
                                            fontFamily: 'var(--font-body, sans-serif)',
                                        }}
                                    >
                                        View Collection
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="ml-1"
                                        >
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
