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
                            className="mb-12 text-center text-3xl font-bold sm:text-4xl"
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
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="relative">
                            <span
                                className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 select-none text-8xl font-bold leading-none sm:-top-10 sm:text-9xl"
                                style={{
                                    fontFamily: 'var(--font-heading, serif)',
                                    color: 'var(--color-primary, #2563eb)',
                                    opacity: 0.12,
                                }}
                                aria-hidden="true"
                            >
                                &ldquo;
                            </span>

                            <blockquote className="relative">
                                <p
                                    className="text-xl leading-relaxed sm:text-2xl md:text-3xl"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-text, #374151)',
                                        fontStyle: 'italic',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    {current.text}
                                </p>
                            </blockquote>

                            <span
                                className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 select-none text-8xl font-bold leading-none sm:-bottom-20 sm:text-9xl"
                                style={{
                                    fontFamily: 'var(--font-heading, serif)',
                                    color: 'var(--color-primary, #2563eb)',
                                    opacity: 0.12,
                                }}
                                aria-hidden="true"
                            >
                                &rdquo;
                            </span>
                        </div>

                        <div className="mt-16 flex flex-col items-center gap-3 sm:mt-20">
                            {current.avatar ? (
                                <img
                                    src={current.avatar}
                                    alt={current.name}
                                    className="h-14 w-14 object-cover"
                                    style={{ borderRadius: '50%' }}
                                />
                            ) : (
                                <div
                                    className="flex h-14 w-14 items-center justify-center text-lg font-semibold"
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
                                    className="text-base font-semibold"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                                    }}
                                >
                                    {current.name}
                                </p>
                                {current.role && (
                                    <p
                                        className="text-sm"
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

                        {testimonials.length > 1 && (
                            <div className="mt-8 flex justify-center gap-2">
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
