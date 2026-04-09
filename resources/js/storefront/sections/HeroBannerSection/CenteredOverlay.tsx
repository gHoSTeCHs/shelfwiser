import { useState, useEffect } from 'react';
import type { SectionProps } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

export function CenteredOverlay({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;
    const secondaryCtaText = config.secondary_cta_text as string | undefined;
    const secondaryCtaLink = config.secondary_cta_link as string | undefined;
    const image = config.image as string | undefined;
    const overlayOpacity = (config.overlay_opacity as number) ?? 0.45;
    const [isLoaded, setIsLoaded] = useState(!image);
    const [isCtaHovered, setIsCtaHovered] = useState(false);
    const [isSecondaryHovered, setIsSecondaryHovered] = useState(false);

    useEffect(() => {
        if (!image) return;
        const img = new Image();
        img.onload = () => setIsLoaded(true);
        img.src = image;
    }, [image]);

    return (
        <section
            className="relative flex min-h-[60vh] items-center justify-center overflow-hidden sm:min-h-[85vh]"
        >
            {image && (
                <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20000ms] ease-linear"
                    style={{
                        transform: isLoaded ? 'scale(1.08)' : 'scale(1)',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 1.2s ease, transform 20s linear',
                    }}
                />
            )}

            {!image && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(ellipse 80% 60% at 20% 80%, var(--color-primary, #047857) 0%, transparent 60%),
                            radial-gradient(ellipse 60% 50% at 80% 20%, var(--color-secondary, #064E3B) 0%, transparent 50%),
                            radial-gradient(ellipse 50% 40% at 50% 50%, var(--color-accent, #D97706) 0%, transparent 60%),
                            linear-gradient(135deg, var(--color-secondary, #064E3B) 0%, #0a0a0a 50%, var(--color-secondary, #064E3B) 100%)
                        `,
                    }}
                />
            )}

            <div
                className="absolute inset-0"
                style={{
                    background: image
                        ? `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.3}) 0%, rgba(0,0,0,${overlayOpacity}) 40%, rgba(0,0,0,${overlayOpacity * 1.1}) 100%)`
                        : 'none',
                }}
            />

            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                    backgroundSize: '128px 128px',
                }}
            />

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />

            <ScrollAnimation>
                <div
                    className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8"
                    style={{
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
                    }}
                >
                    {heading && (
                        <h1
                            className="text-balance"
                            style={{
                                margin: 0,
                                fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
                                fontWeight: 800,
                                lineHeight: 1.05,
                                letterSpacing: '-0.03em',
                                color: '#ffffff',
                                fontFamily: 'var(--font-heading, inherit)',
                                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                            }}
                        >
                            {heading}
                        </h1>
                    )}

                    {subheading && (
                        <p
                            style={{
                                marginTop: '1.25rem',
                                fontSize: 'clamp(1rem, 2.2vw, 1.35rem)',
                                lineHeight: 1.7,
                                color: 'rgba(255, 255, 255, 0.85)',
                                fontFamily: 'var(--font-body, inherit)',
                                maxWidth: '540px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                fontWeight: 400,
                                letterSpacing: '0.01em',
                            }}
                        >
                            {subheading}
                        </p>
                    )}

                    {(ctaText || secondaryCtaText) && (
                        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
                            {ctaText && ctaLink && (
                                <a
                                    href={ctaLink}
                                    onMouseEnter={() => setIsCtaHovered(true)}
                                    onMouseLeave={() => setIsCtaHovered(false)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '16px 36px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        letterSpacing: '0.02em',
                                        color: 'var(--color-button-foreground, #ffffff)',
                                        backgroundColor: 'var(--color-primary, #047857)',
                                        borderRadius: 'var(--radius, 8px)',
                                        textDecoration: 'none',
                                        fontFamily: 'var(--font-body, inherit)',
                                        boxShadow: isCtaHovered
                                            ? '0 8px 30px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                                            : '0 4px 15px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
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
                                    onMouseEnter={() => setIsSecondaryHovered(true)}
                                    onMouseLeave={() => setIsSecondaryHovered(false)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '16px 36px',
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        letterSpacing: '0.02em',
                                        color: '#ffffff',
                                        backgroundColor: isSecondaryHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        borderRadius: 'var(--radius, 8px)',
                                        textDecoration: 'none',
                                        fontFamily: 'var(--font-body, inherit)',
                                        backdropFilter: 'blur(8px)',
                                        transform: isSecondaryHovered ? 'translateY(-2px)' : 'translateY(0)',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    {secondaryCtaText}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </ScrollAnimation>

            <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:bottom-8"
                style={{
                    opacity: isLoaded ? 0.5 : 0,
                    transition: 'opacity 1s ease 1.5s',
                }}
            >
                <div
                    className="h-10 w-6 rounded-full border-2 border-white/40 p-1"
                >
                    <div
                        className="mx-auto h-2 w-1 rounded-full bg-white/60"
                        style={{
                            animation: 'heroScrollBounce 2s ease-in-out infinite',
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes heroScrollBounce {
                    0%, 100% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(12px); opacity: 0.3; }
                }
            `}</style>
        </section>
    );
}
