import { useState } from 'react';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import type { SectionProps } from '../../types/storefront';

export function ImageLeft({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const text = config.text as string | undefined;
    const image = config.image as string | undefined;
    const ctaText = config.cta_text as string | undefined;
    const ctaLink = config.cta_link as string | undefined;
    const [imgHovered, setImgHovered] = useState(false);
    const [btnHovered, setBtnHovered] = useState(false);

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-14 lg:gap-20">
                    {/* Image */}
                    <ScrollAnimation className="w-full md:w-1/2">
                        <div
                            style={{
                                overflow: 'hidden',
                                borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                            }}
                            onMouseEnter={() => setImgHovered(true)}
                            onMouseLeave={() => setImgHovered(false)}
                        >
                            {image ? (
                                <img
                                    src={image}
                                    alt={heading ?? ''}
                                    className="h-auto w-full object-cover"
                                    style={{
                                        transform: imgHovered ? 'scale(1.03)' : 'scale(1)',
                                        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        aspectRatio: '4 / 3',
                                        backgroundColor: 'var(--color-surface, #f3f4f6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 64,
                                            fontWeight: 800,
                                            fontFamily: 'var(--font-heading, inherit)',
                                            color: 'var(--color-primary, #e94560)',
                                            opacity: 0.1,
                                            letterSpacing: '-0.04em',
                                        }}
                                    >
                                        {heading?.charAt(0)?.toUpperCase() ?? ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </ScrollAnimation>

                    {/* Text */}
                    <ScrollAnimation className="w-full md:w-1/2" delay={150}>
                        <div className="flex flex-col gap-5">
                            {heading && (
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                        fontWeight: 800,
                                        letterSpacing: '-0.03em',
                                        textTransform: 'var(--heading-transform, none)' as React.CSSProperties['textTransform'],
                                        lineHeight: 1.15,
                                        fontFamily: 'var(--font-heading, sans-serif)',
                                        color: 'var(--color-foreground, #1a1a1a)',
                                    }}
                                >
                                    {heading}
                                </h2>
                            )}

                            {text && (
                                <p
                                    className="text-base sm:text-[17px]"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-text, #4b5563)',
                                        lineHeight: 1.75,
                                    }}
                                >
                                    {text}
                                </p>
                            )}

                            {ctaText && ctaLink && (
                                <div className="mt-1">
                                    <a
                                        href={ctaLink}
                                        className="inline-block px-7 py-3.5 text-sm font-bold"
                                        style={{
                                            backgroundColor: btnHovered
                                                ? 'var(--color-foreground, #111)'
                                                : 'var(--color-primary, #e94560)',
                                            color: '#fff',
                                            borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            transition: 'background-color 0.2s ease',
                                            textDecoration: 'none',
                                        }}
                                        onMouseEnter={() => setBtnHovered(true)}
                                        onMouseLeave={() => setBtnHovered(false)}
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
