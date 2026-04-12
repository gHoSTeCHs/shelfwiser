import { useState } from 'react';
import type { SectionProps } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

export function MinimalText({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;
    const [isCtaHovered, setIsCtaHovered] = useState(false);

    return (
        <section
            className="relative overflow-hidden"
            style={{
                backgroundColor: 'var(--color-background, #ffffff)',
            }}
        >
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-text, #0C1713) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />

            <div
                className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full opacity-[0.04]"
                style={{
                    background: `radial-gradient(circle, var(--color-primary, #047857) 0%, transparent 70%)`,
                }}
            />

            <ScrollAnimation>
                <div
                    className="relative mx-auto max-w-4xl px-6 sm:px-8"
                    style={{
                        paddingTop: 'clamp(80px, 12vw, 160px)',
                        paddingBottom: 'clamp(80px, 12vw, 160px)',
                        textAlign: 'center',
                    }}
                >
                    {heading && (
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 'clamp(2.75rem, 7vw, 6rem)',
                                fontWeight: 800,
                                lineHeight: 0.98,
                                letterSpacing: '-0.04em',
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
                                marginTop: '2rem',
                                fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
                                lineHeight: 1.7,
                                color: 'var(--color-muted-foreground, #4B5563)',
                                fontFamily: 'var(--font-body, inherit)',
                                maxWidth: '560px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                fontWeight: 400,
                                letterSpacing: '0.01em',
                            }}
                        >
                            {subheading}
                        </p>
                    )}

                    {ctaText && ctaLink && (
                        <div className="mt-10">
                            <a
                                href={ctaLink}
                                onMouseEnter={() => setIsCtaHovered(true)}
                                onMouseLeave={() => setIsCtaHovered(false)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '16px 40px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    letterSpacing: '0.02em',
                                    color: 'var(--color-button-foreground, #ffffff)',
                                    backgroundColor: 'var(--color-primary, #047857)',
                                    borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                    textDecoration: 'none',
                                    fontFamily: 'var(--font-body, inherit)',
                                    boxShadow: isCtaHovered
                                        ? '0 12px 32px -6px rgba(0,0,0,0.2)'
                                        : '0 4px 12px -2px rgba(0,0,0,0.1)',
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
                        </div>
                    )}
                </div>
            </ScrollAnimation>
        </section>
    );
}
