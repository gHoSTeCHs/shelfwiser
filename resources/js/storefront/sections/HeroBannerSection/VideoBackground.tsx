import { useState, useRef, useEffect } from 'react';
import type { SectionProps } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

export function VideoBackground({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;
    const secondaryCtaText = config.secondary_cta_text as string | undefined;
    const secondaryCtaLink = config.secondary_cta_link as string | undefined;
    const image = config.image as string | undefined;
    const videoUrl = config.video_url as string | undefined;
    const overlayOpacity = (config.overlay_opacity as number) ?? 0.5;
    const [isReady, setIsReady] = useState(false);
    const [isCtaHovered, setIsCtaHovered] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoUrl && videoRef.current) {
            videoRef.current.addEventListener('canplay', () => setIsReady(true), { once: true });
        } else if (image) {
            const img = new Image();
            img.onload = () => setIsReady(true);
            img.src = image;
        } else {
            setIsReady(true);
        }
    }, [videoUrl, image]);

    return (
        <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden sm:min-h-[90vh]">
            {videoUrl ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={image || undefined}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                        opacity: isReady ? 1 : 0,
                        transition: 'opacity 1.5s ease',
                    }}
                >
                    <source src={videoUrl} />
                </video>
            ) : image ? (
                <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                        opacity: isReady ? 1 : 0,
                        transform: isReady ? 'scale(1.05)' : 'scale(1)',
                        transition: 'opacity 1.2s ease, transform 20s linear',
                    }}
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(ellipse 90% 70% at 30% 80%, var(--color-primary, #047857) 0%, transparent 50%),
                            radial-gradient(ellipse 70% 60% at 70% 20%, var(--color-accent, #D97706) 0%, transparent 45%),
                            radial-gradient(ellipse 50% 50% at 50% 50%, var(--color-secondary, #064E3B) 0%, transparent 55%),
                            linear-gradient(150deg, #050505 0%, var(--color-secondary, #064E3B) 50%, #050505 100%)
                        `,
                    }}
                />
            )}

            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.4}) 0%, rgba(0,0,0,${overlayOpacity}) 50%, rgba(0,0,0,${overlayOpacity * 1.15}) 100%)`,
                }}
            />

            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                    backgroundSize: '128px 128px',
                }}
            />

            <ScrollAnimation>
                <div
                    className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8"
                    style={{
                        opacity: isReady ? 1 : 0,
                        transform: isReady ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s',
                    }}
                >
                    {heading && (
                        <h1
                            className="text-balance"
                            style={{
                                margin: 0,
                                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                fontWeight: 800,
                                lineHeight: 1.05,
                                letterSpacing: '-0.03em',
                                color: '#ffffff',
                                fontFamily: 'var(--font-heading, inherit)',
                                textShadow: '0 4px 30px rgba(0,0,0,0.4)',
                            }}
                        >
                            {heading}
                        </h1>
                    )}

                    {subheading && (
                        <p
                            style={{
                                marginTop: '1.5rem',
                                fontSize: 'clamp(1rem, 2.2vw, 1.35rem)',
                                lineHeight: 1.7,
                                color: 'rgba(255, 255, 255, 0.85)',
                                fontFamily: 'var(--font-body, inherit)',
                                maxWidth: '540px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                fontWeight: 400,
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
                                    className="inline-flex items-center gap-2.5"
                                    style={{
                                        padding: '16px 36px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        letterSpacing: '0.02em',
                                        color: 'var(--color-button-foreground, #ffffff)',
                                        backgroundColor: 'var(--color-primary, #047857)',
                                        borderRadius: 'var(--btn-radius, var(--radius, 8px))',
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
                                    className="inline-flex items-center gap-2 transition-all hover:-translate-y-0.5"
                                    style={{
                                        padding: '16px 36px',
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                        textDecoration: 'none',
                                        fontFamily: 'var(--font-body, inherit)',
                                        backdropFilter: 'blur(8px)',
                                        transition: 'all 0.25s ease',
                                    }}
                                >
                                    {secondaryCtaText}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </ScrollAnimation>

            {videoUrl && (
                <div className="absolute bottom-6 right-6 z-10 sm:bottom-8 sm:right-8">
                    <div
                        className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium uppercase tracking-wider text-white/50"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                        Live
                    </div>
                </div>
            )}
        </section>
    );
}
