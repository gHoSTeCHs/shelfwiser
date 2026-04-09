import { Cards } from './Cards';
import { List } from './List';
import { Accordion } from './Accordion';
import type { SectionProps } from '../../types/storefront';
import { narrowConfig, narrowData } from '../../lib/section-helpers';

interface CollectionItem {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    product_count: number;
    description?: string;
}

interface CollectionListConfig {
    heading?: string;
    subheading?: string;
    shop_slug: string;
    currency_symbol: string;
    currency_decimals: number;
}

interface CollectionListData {
    collections: CollectionItem[];
}

export function CollectionListSection({ config, variant, data }: SectionProps) {
    const { heading, subheading, shop_slug } = narrowConfig<CollectionListConfig>(config);
    const { collections } = narrowData<CollectionListData>(data);

    if (!collections || collections.length === 0) return null;

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {(heading || subheading) && (
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        {heading && (
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                    color: 'var(--color-foreground, #1a1a1a)',
                                    fontFamily: 'var(--font-heading, sans-serif)',
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
                                    fontFamily: 'var(--font-body, sans-serif)',
                                }}
                            >
                                {subheading}
                            </p>
                        )}
                    </div>
                )}

                {variant === 'accordion' ? (
                    <Accordion collections={collections} shop_slug={shop_slug} />
                ) : variant === 'rows' ? (
                    <List collections={collections} shop_slug={shop_slug} />
                ) : (
                    <Cards collections={collections} shop_slug={shop_slug} />
                )}
            </div>
        </section>
    );
}
