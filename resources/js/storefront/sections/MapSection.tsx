import type { SectionProps } from '../types/storefront';

interface MapConfig {
    heading?: string;
    address: string;
    embed_url?: string;
    height?: string;
}

const SAFE_EMBED_PATTERNS = [
    /^https:\/\/www\.google\.com\/maps\/embed/,
    /^https:\/\/maps\.google\.com\//,
    /^https:\/\/www\.openstreetmap\.org\//,
];

function isSafeEmbedUrl(url: string): boolean {
    return SAFE_EMBED_PATTERNS.some((pattern) => pattern.test(url));
}

export function MapSection({ config }: SectionProps) {
    const { heading, address, embed_url, height } = config as unknown as MapConfig;
    const mapHeight = height || '400px';
    const safeEmbedUrl = embed_url && isSafeEmbedUrl(embed_url) ? embed_url : null;

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

                {safeEmbedUrl ? (
                    <div
                        className="w-full overflow-hidden"
                        style={{
                            borderRadius: 'var(--radius, 8px)',
                            border: '1px solid var(--color-border, #e5e5e5)',
                            height: mapHeight,
                        }}
                    >
                        <iframe
                            src={safeEmbedUrl}
                            title={heading || 'Map'}
                            className="h-full w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-3 p-6"
                        style={{
                            backgroundColor: 'var(--color-surface, #f5f5f5)',
                            borderRadius: 'var(--radius, 8px)',
                            border: '1px solid var(--color-border, #e5e5e5)',
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-primary, #1a1a1a)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                        >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <p
                            className="text-sm sm:text-base"
                            style={{
                                color: 'var(--color-text, #1a1a1a)',
                                fontFamily: 'var(--font-body, sans-serif)',
                            }}
                        >
                            {address}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
