import { useState, useEffect } from 'react';
import type { SectionProps } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

export function SplitImage({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;
    const secondaryCtaText = config.secondary_cta_text as string | undefined;
    const secondaryCtaLink = config.secondary_cta_link as string | undefined;
    const image = config.image as string | undefined;
    const [isLoaded, setIsLoaded] = useState(!image);
    const [isCtaHovered, setIsCtaHovered] = useState(false);

    useEffect(() => {
        if (!image) return;
        const img = new Image();
        img.onload = () => setIsLoaded(true);
        img.src = image;
    }, [image]);

    return (
        <section
            className="flex min-h-[50vh] flex-col-reverse sm:min-h-[70vh] sm:flex-row"
            style={{ backgroundColor: 'var(--color-background, #ffffff)' }}
        >
            <div className="flex items-center sm:w-1/2">
                <div className="w-full px-6 py-16 sm:px-10 sm:py-0 lg:px-16 xl:px-20">
                    <ScrollAnimation>
                        <div
                            className="max-w-lg"
                            style={{
                                opacity: isLoaded ? 1 : 0,
                                transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
                                transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
                            }}
                        >
                            <div
                                className="mb-6 h-1 w-12"
                                style={{
                                    backgroundColor: 'var(--color-primary, #047857)',
                                    borderRadius: '2px',
                                }}
                            />

                            {heading && (
                                <h1
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                                        fontWeight: 800,
                                        lineHeight: 1.08,
                                        letterSpacing: '-0.03em',
                                        color: 'var(--color-foreground, #0C1713)',
                                        fontFamily: 'var(--font-heading, inherit)',
                                    }}
                                >
                                    {heading}
                                </h1>
                            )}

                            {subheading && (
                                <p
                                    style={{
                                        marginTop: '1.25rem',
                                        fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
                                        lineHeight: 1.75,
                                        color: 'var(--color-muted-foreground, #4B5563)',
                                        fontFamily: 'var(--font-body, inherit)',
                                        fontWeight: 400,
                                    }}
                                >
                                    {subheading}
                                </p>
                            )}

                            {(ctaText || secondaryCtaText) && (
                                <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
                                    {ctaText && ctaLink && (
                                        <a
                                            href={ctaLink}
                                            onMouseEnter={() => setIsCtaHovered(true)}
                                            onMouseLeave={() => setIsCtaHovered(false)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '15px 32px',
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                letterSpacing: '0.02em',
                                                color: 'var(--color-button-foreground, #ffffff)',
                                                backgroundColor: 'var(--color-primary, #047857)',
                                                borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                                textDecoration: 'none',
                                                fontFamily: 'var(--font-body, inherit)',
                                                boxShadow: isCtaHovered
                                                    ? '0 8px 24px -4px rgba(0,0,0,0.2)'
                                                    : '0 2px 8px -2px rgba(0,0,0,0.1)',
                                                transform: isCtaHovered ? 'translateY(-2px)' : 'translateY(0)',
                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                            }}
                                        >
                                            {ctaText}
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </a>
                                    )}
                                    {secondaryCtaText && secondaryCtaLink && (
                                        <a
                                            href={secondaryCtaLink}
                                            className="group inline-flex items-center gap-2 text-sm font-medium"
                                            style={{
                                                padding: '15px 24px',
                                                color: 'var(--color-foreground, #0C1713)',
                                                textDecoration: 'none',
                                                fontFamily: 'var(--font-body, inherit)',
                                            }}
                                        >
                                            {secondaryCtaText}
                                            <svg
                                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                style={{ transition: 'transform 0.2s ease' }}
                                                className="group-hover:translate-x-1"
                                            >
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollAnimation>
                </div>
            </div>

            <div className="relative min-h-[40vh] overflow-hidden sm:w-1/2 sm:min-h-0">
                {image ? (
                    <img
                        src={image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                            opacity: isLoaded ? 1 : 0,
                            transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
                            transition: 'opacity 1s ease, transform 8s ease',
                        }}
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `
                                radial-gradient(ellipse 70% 60% at 30% 70%, var(--color-primary, #047857) 0%, transparent 55%),
                                radial-gradient(ellipse 50% 50% at 80% 30%, var(--color-accent, #D97706) 0%, transparent 50%),
                                linear-gradient(160deg, var(--color-surface, #F0FDF4) 0%, var(--color-background, #ffffff) 100%)
                            `,
                        }}
                    />
                )}

                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                        backgroundSize: '128px 128px',
                    }}
                />

                <div
                    className="absolute bottom-0 left-0 top-0 hidden w-24 sm:block"
                    style={{
                        background: `linear-gradient(to right, var(--color-background, #ffffff), transparent)`,
                        zIndex: 1,
                    }}
                />
            </div>
        </section>
    );
}
