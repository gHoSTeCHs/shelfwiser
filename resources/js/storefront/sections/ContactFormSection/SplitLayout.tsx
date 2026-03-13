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

interface ContactData {
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    shop_slug?: string;
}

function ContactInfoIcon({ type }: { type: 'email' | 'phone' | 'location' }) {
    const paths: Record<string, string> = {
        email: 'M2 6a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0l8 5 8-5',
        phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
        location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
    };

    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={paths[type]} />
        </svg>
    );
}

export function SplitLayout({ config, data }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const successMessage = (config.success_message as string) || "Thanks! We'll get back to you soon.";
    const shopSlug = config.shop_slug as string | undefined;
    const contactData = (data as ContactData) || {};

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
            const slug = shopSlug || contactData.shop_slug || '';
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

    const hasContactInfo = contactData.phone || contactData.email || contactData.address;

    const addressParts = [
        contactData.address,
        contactData.city,
        contactData.state,
        contactData.country,
    ].filter(Boolean);

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
                <div className="flex flex-col gap-10 md:flex-row md:gap-16">
                    <ScrollAnimation className="w-full md:w-5/12">
                        <div className="flex flex-col gap-6">
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
                                    className="text-base"
                                    style={{
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-muted, #6b7280)',
                                        lineHeight: 'var(--line-height, 1.7)',
                                    }}
                                >
                                    {subheading}
                                </p>
                            )}

                            {hasContactInfo && (
                                <div className="flex flex-col gap-4 pt-2">
                                    {contactData.email && (
                                        <div
                                            className="flex items-center gap-3"
                                            style={{ color: 'var(--color-text, #4b5563)' }}
                                        >
                                            <span style={{ color: 'var(--color-primary, #2563eb)' }}>
                                                <ContactInfoIcon type="email" />
                                            </span>
                                            <a
                                                href={`mailto:${contactData.email}`}
                                                className="text-sm transition-opacity hover:opacity-80"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-text, #4b5563)',
                                                }}
                                            >
                                                {contactData.email}
                                            </a>
                                        </div>
                                    )}

                                    {contactData.phone && (
                                        <div
                                            className="flex items-center gap-3"
                                            style={{ color: 'var(--color-text, #4b5563)' }}
                                        >
                                            <span style={{ color: 'var(--color-primary, #2563eb)' }}>
                                                <ContactInfoIcon type="phone" />
                                            </span>
                                            <a
                                                href={`tel:${contactData.phone}`}
                                                className="text-sm transition-opacity hover:opacity-80"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-text, #4b5563)',
                                                }}
                                            >
                                                {contactData.phone}
                                            </a>
                                        </div>
                                    )}

                                    {addressParts.length > 0 && (
                                        <div
                                            className="flex items-start gap-3"
                                            style={{ color: 'var(--color-text, #4b5563)' }}
                                        >
                                            <span
                                                className="mt-0.5"
                                                style={{ color: 'var(--color-primary, #2563eb)' }}
                                            >
                                                <ContactInfoIcon type="location" />
                                            </span>
                                            <span
                                                className="text-sm"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-text, #4b5563)',
                                                }}
                                            >
                                                {addressParts.join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollAnimation>

                    <ScrollAnimation className="w-full md:w-7/12" delay={150}>
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

                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <div className="flex flex-1 flex-col gap-1.5">
                                        <label
                                            htmlFor="split-contact-name"
                                            className="text-sm font-medium"
                                            style={{
                                                fontFamily: 'var(--font-body, sans-serif)',
                                                color: 'var(--color-heading, var(--color-text, #374151))',
                                            }}
                                        >
                                            Name
                                        </label>
                                        <input
                                            id="split-contact-name"
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

                                    <div className="flex flex-1 flex-col gap-1.5">
                                        <label
                                            htmlFor="split-contact-email"
                                            className="text-sm font-medium"
                                            style={{
                                                fontFamily: 'var(--font-body, sans-serif)',
                                                color: 'var(--color-heading, var(--color-text, #374151))',
                                            }}
                                        >
                                            Email
                                        </label>
                                        <input
                                            id="split-contact-email"
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
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="split-contact-message"
                                        className="text-sm font-medium"
                                        style={{
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-heading, var(--color-text, #374151))',
                                        }}
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        id="split-contact-message"
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
                                    className="w-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
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
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
}
