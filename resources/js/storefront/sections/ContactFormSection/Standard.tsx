import type React from 'react';
import { useState } from 'react';
import { ScrollAnimation } from '../../components/ScrollAnimation';
import { storefrontFetch } from '../../lib/fetch-client';
import type { SectionProps } from '../../types/storefront';

interface FormState {
    name: string;
    email: string;
    message: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    message?: string;
}

export function Standard({ config, data }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const successMessage = (config.success_message as string) || "Thanks! We'll get back to you soon.";
    const shopSlug = config.shop_slug as string | undefined;

    const [formData, setFormData] = useState<FormState>({
        name: '',
        email: '',
        message: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    function handleChange(field: keyof FormState, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    function validate(): boolean {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const slug = shopSlug || ((data as Record<string, unknown>).shop_slug as string) || '';
            const result = await storefrontFetch(`/${slug}/api/contact`, {
                method: 'POST',
                json: {
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                },
            });

            if (result.ok) {
                setIsSuccess(true);
                setFormData({ name: '', email: '', message: '' });
            } else {
                const responseData = result.data as Record<string, unknown>;
                setServerError(
                    (responseData.message as string) || 'Something went wrong. Please try again.',
                );
            }
        } catch {
            setServerError('Unable to send your message. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 'var(--font-base-size, 16px)',
        color: 'var(--color-text, #1a1a1a)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #d1d5db)',
        borderRadius: 'var(--radius, 8px)',
        outline: 'none',
    };

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <ScrollAnimation>
                    <div className="mx-auto max-w-xl">
                        {(heading || subheading) && (
                            <div className="mb-8 text-center">
                                {heading && (
                                    <h2
                                        className="text-3xl font-bold sm:text-4xl"
                                        style={{
                                            fontFamily: 'var(--font-heading, sans-serif)',
                                            color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                                        }}
                                    >
                                        {heading}
                                    </h2>
                                )}
                                {subheading && (
                                    <p
                                        className="mt-3 text-base"
                                        style={{
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-muted, #6b7280)',
                                        }}
                                    >
                                        {subheading}
                                    </p>
                                )}
                            </div>
                        )}

                        {isSuccess ? (
                            <div
                                className="p-6 text-center"
                                style={{
                                    backgroundColor: 'var(--color-surface, #f0fdf4)',
                                    borderRadius: 'var(--radius, 8px)',
                                    border: '1px solid var(--color-border, #bbf7d0)',
                                }}
                            >
                                <svg
                                    className="mx-auto mb-3"
                                    width="48"
                                    height="48"
                                    viewBox="0 0 48 48"
                                    fill="none"
                                >
                                    <circle
                                        cx="24"
                                        cy="24"
                                        r="22"
                                        stroke="var(--color-primary, #22c55e)"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                    <path
                                        d="M14 24l7 7 13-13"
                                        stroke="var(--color-primary, #22c55e)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </svg>
                                <p
                                    className="text-base font-medium"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                                    }}
                                >
                                    {successMessage}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {serverError && (
                                    <div
                                        className="p-3 text-sm"
                                        style={{
                                            backgroundColor: 'var(--color-error-bg, #fef2f2)',
                                            color: 'var(--color-error, #dc2626)',
                                            borderRadius: 'var(--radius, 8px)',
                                            border: '1px solid var(--color-error-border, #fecaca)',
                                        }}
                                    >
                                        {serverError}
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="contact-name"
                                        className="text-sm font-medium"
                                        style={{
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-heading, var(--color-text, #374151))',
                                        }}
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full px-4 py-3"
                                        style={inputStyle}
                                        placeholder="Your name"
                                    />
                                    {errors.name && (
                                        <p className="text-xs" style={{ color: 'var(--color-error, #dc2626)' }}>
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="contact-email"
                                        className="text-sm font-medium"
                                        style={{
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-heading, var(--color-text, #374151))',
                                        }}
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full px-4 py-3"
                                        style={inputStyle}
                                        placeholder="you@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-xs" style={{ color: 'var(--color-error, #dc2626)' }}>
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="contact-message"
                                        className="text-sm font-medium"
                                        style={{
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-heading, var(--color-text, #374151))',
                                        }}
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        value={formData.message}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                        className="w-full resize-y px-4 py-3"
                                        style={{ ...inputStyle, minHeight: '120px' }}
                                        placeholder="How can we help?"
                                        rows={5}
                                    />
                                    {errors.message && (
                                        <p className="text-xs" style={{ color: 'var(--color-error, #dc2626)' }}>
                                            {errors.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                                    style={{
                                        backgroundColor: 'var(--color-primary, #2563eb)',
                                        color: 'var(--color-primary-foreground, #ffffff)',
                                        borderRadius: 'var(--radius, 8px)',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        border: 'none',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        )}
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
