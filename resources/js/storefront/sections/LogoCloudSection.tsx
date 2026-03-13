import type { SectionProps } from '../types/storefront';

interface LogoItem {
    url: string;
    alt: string;
    link?: string;
}

interface LogoCloudConfig {
    heading?: string;
    logos: LogoItem[];
}

export function LogoCloudSection({ config }: SectionProps) {
    const { heading, logos } = config as unknown as LogoCloudConfig;

    if (!logos || logos.length === 0) {
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
                        className="mb-8 text-center text-lg font-semibold sm:text-xl"
                        style={{
                            color: 'var(--color-text-muted, #666)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                        }}
                    >
                        {heading}
                    </h2>
                )}

                <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
                    {logos.map((logo, index) => {
                        const img = (
                            <img
                                key={index}
                                src={logo.url}
                                alt={logo.alt}
                                className="h-8 max-w-[120px] object-contain transition-all duration-300 sm:h-10 sm:max-w-[140px]"
                                style={{
                                    filter: 'grayscale(100%)',
                                    opacity: 0.6,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.filter = 'grayscale(0%)';
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.filter = 'grayscale(100%)';
                                    e.currentTarget.style.opacity = '0.6';
                                }}
                            />
                        );

                        if (logo.link) {
                            return (
                                <a
                                    key={index}
                                    href={logo.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {img}
                                </a>
                            );
                        }

                        return img;
                    })}
                </div>
            </div>
        </section>
    );
}
