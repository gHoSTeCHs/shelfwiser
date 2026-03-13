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

export function Cards({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const testimonials = (config.testimonials ?? config.items ?? []) as Testimonial[];

    if (testimonials.length === 0) {
        return null;
    }

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

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <ScrollAnimation key={index} delay={index * 100}>
                            <div
                                className="flex h-full flex-col gap-4 p-6"
                                style={{
                                    backgroundColor: 'var(--color-surface, #ffffff)',
                                    borderRadius: 'var(--radius, 8px)',
                                    border: '1px solid var(--color-border, #e5e7eb)',
                                    boxShadow: 'var(--shadow-depth, 0 1px 3px rgba(0,0,0,0.1))',
                                }}
                            >
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    style={{ color: 'var(--color-primary, #2563eb)', opacity: 0.3 }}
                                >
                                    <path
                                        d="M10.667 18.667H5.333L9.333 8h4L10.667 18.667zm12 0h-5.334L21.333 8h4L22.667 18.667z"
                                        fill="currentColor"
                                    />
                                </svg>

                                <p
                                    className="flex-1 text-sm leading-relaxed sm:text-base"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-text, #4b5563)',
                                    }}
                                >
                                    {testimonial.text}
                                </p>

                                {testimonial.rating !== undefined && (
                                    <StarRating rating={testimonial.rating} />
                                )}

                                <div className="flex items-center gap-3">
                                    {testimonial.avatar ? (
                                        <img
                                            src={testimonial.avatar}
                                            alt={testimonial.name}
                                            className="h-10 w-10 shrink-0 object-cover"
                                            style={{ borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-semibold"
                                            style={{
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-primary, #2563eb)',
                                                color: 'var(--color-primary-foreground, #ffffff)',
                                            }}
                                        >
                                            {testimonial.name.charAt(0).toUpperCase()}
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
                                            {testimonial.name}
                                        </p>
                                        {testimonial.role && (
                                            <p
                                                className="text-xs"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-muted, #6b7280)',
                                                }}
                                            >
                                                {testimonial.role}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollAnimation>
                    ))}
                </div>
            </div>
        </section>
    );
}
