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
                    width="18"
                    height="18"
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

export function Slider({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
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

    if (testimonials.length === 0) {
        return null;
    }

    const current = testimonials[activeIndex];

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {heading && (
                    <ScrollAnimation>
                        <h2
                            className="mb-10 text-center text-3xl font-bold sm:text-4xl"
                            style={{
                                fontFamily: 'var(--font-heading, sans-serif)',
                                color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                            }}
                        >
                            {heading}
                        </h2>
                    </ScrollAnimation>
                )}

                <ScrollAnimation>
                    <div className="relative mx-auto max-w-3xl">
                        <div className="flex items-center gap-4">
                            {testimonials.length > 1 && (
                                <button
                                    onClick={goToPrev}
                                    className="hidden shrink-0 items-center justify-center transition-opacity hover:opacity-70 sm:flex"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        border: '1px solid var(--color-border, #e5e7eb)',
                                        backgroundColor: 'var(--color-surface, #ffffff)',
                                        color: 'var(--color-text, #4b5563)',
                                    }}
                                    aria-label="Previous testimonial"
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 4l-6 6 6 6" />
                                    </svg>
                                </button>
                            )}

                            <div
                                className="flex-1 p-6 text-center sm:p-8"
                                style={{
                                    backgroundColor: 'var(--color-surface, #ffffff)',
                                    borderRadius: 'var(--radius, 8px)',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    boxShadow: 'var(--shadow-depth, 0 1px 3px rgba(0,0,0,0.1))',
                                }}
                            >
                                <p
                                    className="mb-6 text-base leading-relaxed sm:text-lg"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-text, #4b5563)',
                                    }}
                                >
                                    &ldquo;{current.text}&rdquo;
                                </p>

                                {current.rating !== undefined && (
                                    <div className="mb-4 flex justify-center">
                                        <StarRating rating={current.rating} />
                                    </div>
                                )}

                                <div className="flex flex-col items-center gap-3">
                                    {current.avatar ? (
                                        <img
                                            src={current.avatar}
                                            alt={current.name}
                                            className="h-12 w-12 object-cover"
                                            style={{ borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <div
                                            className="flex h-12 w-12 items-center justify-center text-sm font-semibold"
                                            style={{
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-primary, #2563eb)',
                                                color: 'var(--color-primary-foreground, #ffffff)',
                                            }}
                                        >
                                            {current.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div>
                                        <p
                                            className="text-sm font-semibold"
                                            style={{
                                                fontFamily: 'var(--font-body, sans-serif)',
                                                color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                                            }}
                                        >
                                            {current.name}
                                        </p>
                                        {current.role && (
                                            <p
                                                className="text-xs"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-muted, #6b7280)',
                                                }}
                                            >
                                                {current.role}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {testimonials.length > 1 && (
                                <button
                                    onClick={goToNext}
                                    className="hidden shrink-0 items-center justify-center transition-opacity hover:opacity-70 sm:flex"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        border: '1px solid var(--color-border, #e5e7eb)',
                                        backgroundColor: 'var(--color-surface, #ffffff)',
                                        color: 'var(--color-text, #4b5563)',
                                    }}
                                    aria-label="Next testimonial"
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M8 4l6 6-6 6" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {testimonials.length > 1 && (
                            <div className="mt-6 flex justify-center gap-2">
                                {testimonials.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        aria-label={`Go to testimonial ${i + 1}`}
                                        className="transition-all"
                                        style={{
                                            width: i === activeIndex ? '24px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            backgroundColor: i === activeIndex
                                                ? 'var(--color-primary, #2563eb)'
                                                : 'var(--color-border, #d1d5db)',
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
