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

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill={i < rating ? 'var(--color-accent, #f59e0b)' : 'none'}
                    stroke={i < rating ? 'var(--color-accent, #f59e0b)' : 'var(--color-border, #d1d5db)'}
                    strokeWidth="1.5"
                >
                    <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z" />
                </svg>
            ))}
        </div>
    );
}

function NavBtn({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            className="hidden shrink-0 items-center justify-center sm:flex"
            style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: hovered
                    ? 'var(--color-primary, #e94560)'
                    : 'var(--color-surface, #f3f4f6)',
                color: hovered ? '#fff' : 'var(--color-foreground, #4b5563)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={`${direction === 'left' ? 'Previous' : 'Next'} testimonial`}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
            </svg>
        </button>
    );
}

export function Slider({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const testimonials = (config.testimonials ?? config.items ?? []) as Testimonial[];
    const [activeIndex, setActiveIndex] = useState(0);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    const goToPrev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }, [testimonials.length]);

    useEffect(() => {
        if (testimonials.length <= 1) return;
        const interval = setInterval(goToNext, 6000);
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
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
                    <div className="relative mx-auto max-w-3xl">
                        <div className="flex items-center gap-5">
                            {testimonials.length > 1 && (
                                <NavBtn direction="left" onClick={goToPrev} />
                            )}

                            <div
                                className="flex-1 p-8 text-center sm:p-10"
                                style={{
                                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                }}
                            >
                                {/* Quote text */}
                                <p
                                    className="text-base leading-relaxed sm:text-lg"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-text, #4b5563)',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    &ldquo;{current.text}&rdquo;
                                </p>

                                {/* Stars */}
                                {current.rating !== undefined && (
                                    <div className="mt-5 flex justify-center">
                                        <StarRating rating={current.rating} />
                                    </div>
                                )}

                                {/* Author */}
                                <div className="mt-6 flex flex-col items-center gap-3">
                                    {current.avatar ? (
                                        <img
                                            src={current.avatar}
                                            alt={current.name}
                                            className="h-12 w-12 object-cover"
                                            style={{ borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <div
                                            className="flex h-12 w-12 items-center justify-center text-sm font-bold"
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
                                            className="text-sm font-bold"
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
                                                className="mt-0.5 text-xs"
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
                            </div>

                            {testimonials.length > 1 && (
                                <NavBtn direction="right" onClick={goToNext} />
                            )}
                        </div>

                        {/* Dot indicators */}
                        {testimonials.length > 1 && (
                            <div className="mt-8 flex justify-center gap-2">
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
