import { useState, useEffect } from 'react';
import { formatCurrency } from '../lib/formatters';
import { narrowConfig } from '../lib/section-helpers';
import type { SectionProps } from '../types/storefront';

interface RecentlyViewedItem {
    id: number;
    name: string;
    slug: string;
    price: number;
    image: string | null;
}

interface RecentlyViewedConfig {
    heading?: string;
    max_items?: number;
    shop_slug: string;
    currency_symbol: string;
    currency_decimals: number;
}

const STORAGE_KEY = 'storefront_recently_viewed';

function getRecentlyViewed(maxItems: number): RecentlyViewedItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const items = JSON.parse(raw) as RecentlyViewedItem[];
        if (!Array.isArray(items)) return [];
        return items.slice(0, maxItems);
    } catch {
        return [];
    }
}

export function RecentlyViewedSection({ config }: SectionProps) {
    const {
        heading,
        max_items,
        shop_slug,
        currency_symbol,
        currency_decimals,
    } = narrowConfig<RecentlyViewedConfig>(config);

    const [items, setItems] = useState<RecentlyViewedItem[]>([]);

    useEffect(() => {
        setItems(getRecentlyViewed(max_items || 10));
    }, [max_items]);

    if (items.length === 0) {
        return null;
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {heading && (
                    <h2
                        className="mb-6 text-xl font-bold sm:text-2xl"
                        style={{
                            color: 'var(--color-text, #1a1a1a)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                            fontWeight: 'var(--font-heading-weight, 700)',
                        }}
                    >
                        {heading}
                    </h2>
                )}

                <div
                    className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={`/store/${shop_slug}/products/${item.slug}`}
                            className="block shrink-0 transition-shadow duration-300 hover:shadow-md"
                            style={{
                                width: '180px',
                                scrollSnapAlign: 'start',
                                borderRadius: 'var(--radius, 8px)',
                                border: '1px solid var(--color-border, #e5e5e5)',
                                backgroundColor: 'var(--color-background, #ffffff)',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                className="overflow-hidden"
                                style={{
                                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                                    aspectRatio: '1/1',
                                }}
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <svg
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="var(--color-text-muted, #ccc)"
                                            strokeWidth="1"
                                        >
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h3
                                    className="truncate text-sm font-medium"
                                    style={{
                                        color: 'var(--color-text, #1a1a1a)',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                    }}
                                >
                                    {item.name}
                                </h3>
                                <div
                                    className="mt-1 text-sm font-semibold"
                                    style={{ color: 'var(--color-text, #1a1a1a)' }}
                                >
                                    {formatCurrency(item.price, currency_symbol, currency_decimals)}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
