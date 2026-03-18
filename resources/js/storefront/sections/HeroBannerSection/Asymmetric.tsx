import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

export function Asymmetric({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;
    const image = config.image as string | undefined;

    return (
        <section
            style={{
                minHeight: '60vh',
                display: 'flex',
                backgroundColor: 'var(--color-background, #ffffff)',
                overflow: 'hidden',
            }}
            className="flex-col sm:flex-row"
        >
            <div
                className="flex items-center px-6 py-12 sm:w-2/5 sm:px-10 sm:py-0 lg:px-16"
                style={{ minHeight: '40vh' }}
            >
                <ScrollAnimation>
                    <div style={{ maxWidth: '480px' }}>
                        {heading && (
                            <h1
                                style={{
                                    margin: 0,
                                    fontSize: 'clamp(1.75rem, 4vw, 3.25rem)',
                                    fontWeight: 700,
                                    lineHeight: 1.1,
                                    color: 'var(--color-foreground, #111827)',
                                    fontFamily: 'var(--font-heading, inherit)',
                                }}
                            >
                                {heading}
                            </h1>
                        )}

                        {subheading && (
                            <p
                                style={{
                                    marginTop: '16px',
                                    fontSize: 'clamp(0.95rem, 1.5vw, 1.125rem)',
                                    lineHeight: 1.7,
                                    color: 'var(--color-muted-foreground, #6b7280)',
                                    fontFamily: 'var(--font-body, inherit)',
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
                                    marginTop: '28px',
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
            </div>

            <div
                className="sm:w-3/5"
                style={{
                    position: 'relative',
                    minHeight: '300px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-surface, #f3f4f6)',
                }}
            >
                <div
                    className="hidden sm:block"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '-48px',
                        width: '96px',
                        background: 'linear-gradient(to right, var(--color-background, #ffffff), transparent)',
                        zIndex: 1,
                    }}
                />

                {image ? (
                    <img
                        src={image}
                        alt=""
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-muted, #9ca3af)',
                        }}
                    >
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>
        </section>
    );
}
