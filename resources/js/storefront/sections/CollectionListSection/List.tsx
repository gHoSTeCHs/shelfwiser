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

export function List({ collections, shop_slug }: ListProps) {
    return (
        <div className="space-y-4">
            {collections.map((collection) => (
                <a
                    key={collection.id}
                    href={`/store/${shop_slug}/collections/${collection.slug}`}
                    className="flex items-center gap-4 p-4 transition-shadow duration-300 hover:shadow-md sm:gap-6"
                    style={{
                        borderRadius: 'var(--radius, 8px)',
                        border: '1px solid var(--color-border, #e5e5e5)',
                        backgroundColor: 'var(--color-background, #ffffff)',
                    }}
                >
                    <div
                        className="shrink-0 overflow-hidden"
                        style={{
                            width: '80px',
                            height: '80px',
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
                                    width="28"
                                    height="28"
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
                        {collection.description && (
                            <p
                                className="mt-0.5 line-clamp-1 text-sm"
                                style={{
                                    color: 'var(--color-text-muted, #666)',
                                    fontFamily: 'var(--font-body, sans-serif)',
                                }}
                            >
                                {collection.description}
                            </p>
                        )}
                        <p
                            className="mt-1 text-xs"
                            style={{
                                color: 'var(--color-text-muted, #888)',
                                fontFamily: 'var(--font-body, sans-serif)',
                            }}
                        >
                            {collection.product_count} {collection.product_count === 1 ? 'product' : 'products'}
                        </p>
                    </div>

                    <div
                        className="hidden shrink-0 text-sm font-medium sm:block"
                        style={{
                            color: 'var(--color-primary, #1a1a1a)',
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        View
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-1 inline-block"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>
                </a>
            ))}
        </div>
    );
}
