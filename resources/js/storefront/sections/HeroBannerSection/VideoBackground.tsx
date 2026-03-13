import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { ScrollAnimation } from '../../components/ScrollAnimation';

export function VideoBackground({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;
    const image = config.image as string | undefined;
    const videoUrl = config.video_url as string | undefined;
    const overlayOpacity = (config.overlay_opacity as number) ?? 0.5;

    return (
        <section
            style={{
                position: 'relative',
                minHeight: '50vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
            className="sm:min-h-[70vh]"
        >
            {videoUrl ? (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={image || undefined}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                >
                    <source src={videoUrl} />
                </video>
            ) : image ? (
                <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            ) : null}

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                }}
            />

            <ScrollAnimation>
                <div
                    className="px-4 sm:px-6"
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        textAlign: 'center',
                        maxWidth: 'var(--container-width, 1280px)',
                    }}
                >
                    {heading && (
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 'clamp(2rem, 5vw, 4rem)',
                                fontWeight: 700,
                                lineHeight: 1.1,
                                color: '#ffffff',
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
                                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                lineHeight: 1.6,
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontFamily: 'var(--font-body, inherit)',
                                maxWidth: '640px',
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
                                marginTop: '32px',
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
