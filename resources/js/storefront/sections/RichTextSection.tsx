import { ScrollAnimation } from '../components/ScrollAnimation';
import type { SectionProps } from '../types/storefront';

const maxWidthMap: Record<string, string> = {
    narrow: '640px',
    medium: '768px',
    wide: '1024px',
    full: '100%',
};

export function RichTextSection({ config }: SectionProps) {
    const content = (config.content as string) ?? '';
    const maxWidth = maxWidthMap[(config.max_width as string) ?? 'medium'] ?? '768px';

    if (!content) {
        return null;
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <ScrollAnimation>
                    <div
                        className="storefront-prose mx-auto"
                        style={{ maxWidth }}
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </ScrollAnimation>
            </div>

            <style>{`
                .storefront-prose {
                    font-family: var(--font-body, sans-serif);
                    font-size: var(--font-base-size, 16px);
                    line-height: var(--line-height, 1.7);
                    color: var(--color-text, #1a1a1a);
                }

                .storefront-prose h1,
                .storefront-prose h2,
                .storefront-prose h3,
                .storefront-prose h4,
                .storefront-prose h5,
                .storefront-prose h6 {
                    font-family: var(--font-heading, sans-serif);
                    color: var(--color-heading, var(--color-text, #1a1a1a));
                    font-weight: 700;
                    line-height: 1.3;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                }

                .storefront-prose h1 { font-size: 2.25em; }
                .storefront-prose h2 { font-size: 1.75em; }
                .storefront-prose h3 { font-size: 1.375em; }
                .storefront-prose h4 { font-size: 1.125em; }

                .storefront-prose p {
                    margin-bottom: 1.25em;
                }

                .storefront-prose a {
                    color: var(--color-primary, #2563eb);
                    text-decoration: underline;
                    text-underline-offset: 2px;
                    transition: opacity 0.15s ease;
                }

                .storefront-prose a:hover {
                    opacity: 0.8;
                }

                .storefront-prose strong {
                    font-weight: 700;
                    color: var(--color-heading, var(--color-text, #1a1a1a));
                }

                .storefront-prose em {
                    font-style: italic;
                }

                .storefront-prose ul,
                .storefront-prose ol {
                    margin-bottom: 1.25em;
                    padding-left: 1.5em;
                }

                .storefront-prose ul {
                    list-style-type: disc;
                }

                .storefront-prose ol {
                    list-style-type: decimal;
                }

                .storefront-prose li {
                    margin-bottom: 0.375em;
                }

                .storefront-prose li > ul,
                .storefront-prose li > ol {
                    margin-top: 0.375em;
                    margin-bottom: 0;
                }

                .storefront-prose blockquote {
                    border-left: 3px solid var(--color-primary, #2563eb);
                    padding-left: 1em;
                    margin: 1.5em 0;
                    font-style: italic;
                    color: var(--color-muted, #6b7280);
                }

                .storefront-prose img {
                    max-width: 100%;
                    height: auto;
                    border-radius: var(--radius, 8px);
                    margin: 1.5em 0;
                }

                .storefront-prose hr {
                    border: none;
                    border-top: 1px solid var(--color-border, #e5e7eb);
                    margin: 2em 0;
                }

                .storefront-prose code {
                    font-size: 0.875em;
                    padding: 0.2em 0.4em;
                    border-radius: calc(var(--radius, 8px) * 0.5);
                    background: var(--color-surface, #f3f4f6);
                }

                .storefront-prose pre {
                    padding: 1em;
                    border-radius: var(--radius, 8px);
                    background: var(--color-surface, #f3f4f6);
                    overflow-x: auto;
                    margin: 1.5em 0;
                }

                .storefront-prose pre code {
                    padding: 0;
                    background: none;
                }

                .storefront-prose table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1.5em 0;
                }

                .storefront-prose th,
                .storefront-prose td {
                    padding: 0.5em 0.75em;
                    border: 1px solid var(--color-border, #e5e7eb);
                    text-align: left;
                }

                .storefront-prose th {
                    font-weight: 700;
                    background: var(--color-surface, #f3f4f6);
                }
            `}</style>
        </section>
    );
}
