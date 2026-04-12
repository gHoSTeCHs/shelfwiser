import { useState } from 'react';
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
                    width="15"
                    height="15"
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

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
    const [hovered, setHovered] = useState(false);

    return (
        <ScrollAnimation delay={index * 80}>
            <div
                className="flex h-full flex-col p-7"
                style={{
                    backgroundColor: 'var(--color-card-bg, #ffffff)',
                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                    border: hovered
                        ? '1px solid var(--color-primary, #e94560)'
                        : '1px solid var(--color-border, #e5e7eb)',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    boxShadow: hovered
                        ? '0 8px 24px -8px rgba(0,0,0,0.1)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Top: stars + quote mark */}
                <div className="mb-5 flex items-center justify-between">
                    {testimonial.rating !== undefined ? (
                        <StarRating rating={testimonial.rating} />
                    ) : (
                        <div />
                    )}
                    <span
                        style={{
                            fontSize: 36,
                            fontWeight: 800,
                            lineHeight: 1,
                            color: 'var(--color-primary, #e94560)',
                            opacity: 0.2,
                            fontFamily: 'var(--font-heading, serif)',
                        }}
                    >
                        &ldquo;
                    </span>
                </div>

                {/* Quote text */}
                <p
                    className="flex-1 text-[15px] leading-[1.7]"
                    style={{
                        fontFamily: 'var(--font-body, sans-serif)',
                        color: 'var(--color-text, #4b5563)',
                    }}
                >
                    {testimonial.text}
                </p>

                {/* Author */}
                <div
                    className="mt-6 flex items-center gap-3 pt-5"
                    style={{ borderTop: '1px solid var(--color-border, #f0f0f0)' }}
                >
                    {testimonial.avatar ? (
                        <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="h-10 w-10 shrink-0 object-cover"
                            style={{ borderRadius: '50%' }}
                        />
                    ) : (
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold"
                            style={{
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-primary, #e94560)',
                                color: '#fff',
                            }}
                        >
                            {testimonial.name.charAt(0).toUpperCase()}
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
                            {testimonial.name}
                        </p>
                        {testimonial.role && (
                            <p
                                className="text-xs"
                                style={{
                                    fontFamily: 'var(--font-body, sans-serif)',
                                    color: 'var(--color-muted-foreground, #6b7280)',
                                    marginTop: 1,
                                }}
                            >
                                {testimonial.role}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </ScrollAnimation>
    );
}

export function Cards({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const testimonials = (config.testimonials ?? config.items ?? []) as Testimonial[];

    if (testimonials.length === 0) return null;

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
                                        textTransform: 'var(--heading-transform, none)' as React.CSSProperties['textTransform'],
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

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard key={index} testimonial={testimonial} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
