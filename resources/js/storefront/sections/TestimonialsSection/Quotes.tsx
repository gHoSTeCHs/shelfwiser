import { useCallback, useEffect, useState } from 'react';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import type { SectionProps } from '../../types/storefront';

interface Testimonial {
    name: string;
    role?: string;
    text: string;
    avatar?: string;
    rating?: number;
}

export function Quotes({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const testimonials = (config.testimonials ?? config.items ?? []) as Testimonial[];
    const [activeIndex, setActiveIndex] = useState(0);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    useEffect(() => {
        if (testimonials.length <= 1) return;
        const interval = setInterval(goToNext, 7000);
        return () => clearInterval(interval);
    }, [goToNext, testimonials.length]);

    if (testimonials.length === 0) return null;

    const current = testimonials[activeIndex];

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {(heading || subheading) && (
                    <ScrollAnimation>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            {heading && (
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                        fontWeight: 800,
                                        letterSpacing: '-0.03em',
                                        fontFamily: 'var(--font-heading, sans-serif)',
                                        color: 'var(--color-foreground, #1a1a1a)',
                                    }}
                                >
                                    {heading}
                                </h2>
                            )}
                            {subheading && (
                                <p
                                    style={{
                                        marginTop: 10,
                                        fontSize: '1.05rem',
                                        color: 'var(--color-muted-foreground, #6b7280)',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                    }}
                                >
                                    {subheading}
                                </p>
                            )}
                        </div>
                    </ScrollAnimation>
                )}

                <ScrollAnimation>
                    <div className="mx-auto max-w-3xl text-center">
                        {/* Large quote */}
                        <div className="relative">
                            {/* Opening quote mark — big, bold, primary color */}
                            <span
                                className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 select-none"
                                style={{
                                    fontSize: 'clamp(5rem, 12vw, 8rem)',
                                    fontWeight: 800,
                                    lineHeight: 1,
                                    fontFamily: 'var(--font-heading, serif)',
                                    color: 'var(--color-primary, #e94560)',
                                    opacity: 0.1,
                                }}
                                aria-hidden="true"
                            >
                                &ldquo;
                            </span>

                            <blockquote className="relative pt-8">
                                <p
                                    style={{
                                        fontSize: 'clamp(1.15rem, 2.5vw, 1.6rem)',
                                        lineHeight: 1.7,
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-text, #374151)',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {current.text}
                                </p>
                            </blockquote>
                        </div>

                        {/* Author */}
                        <div className="mt-10 flex flex-col items-center gap-3">
                            {current.avatar ? (
                                <img
                                    src={current.avatar}
                                    alt={current.name}
                                    className="h-14 w-14 object-cover"
                                    style={{
                                        borderRadius: '50%',
                                        border: '2px solid var(--color-primary, #e94560)',
                                    }}
                                />
                            ) : (
                                <div
                                    className="flex h-14 w-14 items-center justify-center text-lg font-bold"
                                    style={{
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--color-primary, #e94560)',
                                        color: '#fff',
                                    }}
                                >
                                    {current.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p
                                    className="text-base font-bold"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-foreground, #1a1a1a)',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {current.name}
                                </p>
                                {current.role && (
                                    <p
                                        className="mt-0.5 text-sm"
                                        style={{
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-muted-foreground, #6b7280)',
                                        }}
                                    >
                                        {current.role}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Dot indicators */}
                        {testimonials.length > 1 && (
                            <div className="mt-10 flex justify-center gap-2">
                                {testimonials.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        aria-label={`Go to testimonial ${i + 1}`}
                                        style={{
                                            width: i === activeIndex ? 28 : 8,
                                            height: 8,
                                            borderRadius: 4,
                                            border: 'none',
                                            padding: 0,
                                            cursor: 'pointer',
                                            backgroundColor: i === activeIndex
                                                ? 'var(--color-primary, #e94560)'
                                                : 'var(--color-border, #d1d5db)',
                                            transition: 'width 0.3s ease, background-color 0.3s ease',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
