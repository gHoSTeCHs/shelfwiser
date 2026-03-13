import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

export function MinimalText({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;

    return (
        <section
            style={{
                padding: 'var(--section-spacing, 64px) 0',
                backgroundColor: 'var(--color-background, #ffffff)',
            }}
        >
            <ScrollAnimation>
                <div
                    className="mx-auto px-4 sm:px-6"
                    style={{
                        maxWidth: 'var(--container-width, 1280px)',
                        textAlign: 'center',
                        paddingTop: '48px',
                        paddingBottom: '48px',
                    }}
                >
                    {heading && (
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                fontWeight: 700,
                                lineHeight: 1.05,
                                color: 'var(--color-foreground, #111827)',
                                fontFamily: 'var(--font-heading, inherit)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {heading}
                        </h1>
                    )}

                    {subheading && (
                        <p
                            style={{
                                marginTop: '24px',
                                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                lineHeight: 1.7,
                                color: 'var(--color-muted-foreground, #6b7280)',
                                fontFamily: 'var(--font-body, inherit)',
                                maxWidth: '600px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                            }}
                        >
                            {subheading}
                        </p>
                    )}

                    {ctaText && ctaLink && (
                        <a
                            href={ctaLink}
                            style={{
                                display: 'inline-block',
                                marginTop: '36px',
                                padding: '14px 32px',
                                fontSize: '16px',
                                fontWeight: 600,
                                color: 'var(--color-button-foreground, #ffffff)',
                                backgroundColor: 'var(--color-primary, #6366f1)',
                                borderRadius: 'var(--radius, 8px)',
                                textDecoration: 'none',
                                transition: 'opacity 0.2s ease',
                                fontFamily: 'var(--font-body, inherit)',
                            }}
                        >
                            {ctaText}
                        </a>
                    )}
                </div>
            </ScrollAnimation>
        </section>
    );
}
