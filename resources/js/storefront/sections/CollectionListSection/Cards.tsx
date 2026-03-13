import { useId } from 'react';

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

export function Cards({ collections, shop_slug }: CardsProps) {
    const gridId = useId().replace(/:/g, '');

    return (
        <>
            <style>{`
                #collection-grid-${gridId} {
                    display: grid;
                    gap: 1.5rem;
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
                    <a
                        key={collection.id}
                        href={`/store/${shop_slug}/collections/${collection.slug}`}
                        className="group block overflow-hidden transition-shadow duration-300 hover:shadow-lg"
                        style={{
                            borderRadius: 'var(--radius, 8px)',
                            border: '1px solid var(--color-border, #e5e5e5)',
                            backgroundColor: 'var(--color-background, #ffffff)',
                        }}
                    >
                        <div
                            className="relative overflow-hidden"
                            style={{
                                aspectRatio: '16/9',
                                backgroundColor: 'var(--color-surface, #f5f5f5)',
                            }}
                        >
                            {collection.image ? (
                                <img
                                    src={collection.image}
                                    alt={collection.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <svg
                                        width="40"
                                        height="40"
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

                        <div className="p-4">
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
                                className="mt-1 text-xs"
                                style={{
                                    color: 'var(--color-text-muted, #666)',
                                    fontFamily: 'var(--font-body, sans-serif)',
                                }}
                            >
                                {collection.product_count} {collection.product_count === 1 ? 'product' : 'products'}
                            </p>
                        </div>
                    </a>
                ))}
            </div>
        </>
    );
}
