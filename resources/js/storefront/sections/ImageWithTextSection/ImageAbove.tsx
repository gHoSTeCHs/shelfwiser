import { ScrollAnimation } from '../../components/ScrollAnimation';
import type { SectionProps } from '../../types/storefront';

export function ImageAbove({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const text = config.text as string | undefined;
    const image = config.image as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <div className="flex flex-col gap-8">
                    <ScrollAnimation>
                        {image && (
                            <img
                                src={image}
                                alt={heading ?? ''}
                                className="h-auto w-full object-cover"
                                style={{ borderRadius: 'var(--radius, 8px)' }}
                            />
                        )}
                    </ScrollAnimation>

                    <ScrollAnimation delay={150}>
                        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                            {heading && (
                                <h2
                                    className="text-3xl font-bold sm:text-4xl"
                                    style={{
                                        fontFamily: 'var(--font-heading, sans-serif)',
                                        color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                                    }}
                                >
                                    {heading}
                                </h2>
                            )}

                            {text && (
                                <p
                                    className="text-base sm:text-lg"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-text, #4b5563)',
                                        lineHeight: 'var(--line-height, 1.7)',
                                    }}
                                >
                                    {text}
                                </p>
                            )}

                            {ctaText && ctaLink && (
                                <div className="mt-2">
                                    <a
                                        href={ctaLink}
                                        className="inline-block px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                                        style={{
                                            backgroundColor: 'var(--color-primary, #2563eb)',
                                            color: 'var(--color-primary-foreground, #ffffff)',
                                            borderRadius: 'var(--radius, 8px)',
                                            fontFamily: 'var(--font-body, sans-serif)',
                                        }}
                                    >
                                        {ctaText}
                                    </a>
                                </div>
                            )}
                        </div>
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
}
