import type { SectionProps } from '../types/storefront';

interface BannerConfig {
    heading: string;
    subheading?: string;
    cta_text?: string;
    cta_link?: string;
    background_image?: string;
    background_color?: string;
}

export function BannerSection({ config }: SectionProps) {
    const {
        heading,
        subheading,
        cta_text,
        cta_link,
        background_image,
        background_color,
    } = config as unknown as BannerConfig;

    const bgColor = background_color || 'var(--color-primary, #1a1a1a)';

    return (
        <section
            className="relative w-full overflow-hidden"
            style={{
                padding: 'var(--section-spacing, 64px) 0',
            }}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: bgColor,
                }}
            >
                {background_image && (
                    <img
                        src={background_image}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{ opacity: 0.4 }}
                    />
                )}
            </div>

            <div
                className="relative mx-auto px-4 py-16 text-center sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <h2
                    className="text-2xl font-bold sm:text-3xl lg:text-4xl"
                    style={{
                        color: 'var(--color-primary-foreground, #ffffff)',
                        fontFamily: 'var(--font-heading, sans-serif)',
                        fontWeight: 'var(--font-heading-weight, 700)',
                    }}
                >
                    {heading}
                </h2>

                {subheading && (
                    <p
                        className="mx-auto mt-3 max-w-2xl text-base sm:text-lg"
                        style={{
                            color: 'var(--color-primary-foreground, #ffffff)',
                            opacity: 0.85,
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        {subheading}
                    </p>
                )}

                {cta_text && cta_link && (
                    <a
                        href={cta_link}
                        className="mt-6 inline-block px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-90"
                        style={{
                            backgroundColor: 'var(--color-primary-foreground, #ffffff)',
                            color: bgColor,
                            borderRadius: 'var(--radius, 8px)',
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        {cta_text}
                    </a>
                )}
            </div>
        </section>
    );
}
