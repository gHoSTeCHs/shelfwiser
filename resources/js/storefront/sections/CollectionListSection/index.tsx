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
    shop_slug: string;
    currency_symbol: string;
    currency_decimals: number;
}

interface CollectionListData {
    collections: CollectionItem[];
}

export function CollectionListSection({ config, variant, data }: SectionProps) {
    const { heading, shop_slug } = narrowConfig<CollectionListConfig>(config);
    const { collections } = narrowData<CollectionListData>(data);

    if (!collections || collections.length === 0) {
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
                        className="mb-8 text-xl font-bold sm:text-2xl"
                        style={{
                            color: 'var(--color-text, #1a1a1a)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                            fontWeight: 'var(--font-heading-weight, 700)',
                        }}
                    >
                        {heading}
                    </h2>
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
