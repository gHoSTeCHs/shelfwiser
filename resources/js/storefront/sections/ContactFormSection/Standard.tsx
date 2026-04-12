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

type FieldName = keyof FormState;

function FormField({
    id,
    label,
    type = 'text',
    value,
    onChange,
    error,
    placeholder,
    multiline = false,
}: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    multiline?: boolean;
}) {
    const [focused, setFocused] = useState(false);

    const baseStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 16px',
        fontSize: 15,
        fontFamily: 'var(--font-body, sans-serif)',
        color: 'var(--color-text, #1a1a1a)',
        backgroundColor: 'var(--color-card-bg, #ffffff)',
        border: error
            ? '1.5px solid var(--color-error, #dc2626)'
            : focused
              ? '1.5px solid var(--color-primary, #e94560)'
              : '1.5px solid var(--color-border, #e5e7eb)',
        borderRadius: 'var(--radius, 8px)',
        outline: 'none',
        boxShadow: focused && !error
            ? '0 0 0 3px color-mix(in srgb, var(--color-primary, #e94560) 12%, transparent)'
            : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    };

    return (
        <div className="flex flex-col gap-2">
            <label
                htmlFor={id}
                className="text-[13px] font-bold uppercase"
                style={{
                    letterSpacing: '0.06em',
                    fontFamily: 'var(--font-body, sans-serif)',
                    color: 'var(--color-muted-foreground, #6b7280)',
                }}
            >
                {label}
            </label>
            {multiline ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    rows={5}
                    className="resize-y"
                    style={{ ...baseStyle, minHeight: 140, lineHeight: 1.6 }}
                />
            ) : (
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    style={baseStyle}
                />
            )}
            {error && (
                <p
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-error, #dc2626)' }}
                >
                    {error}
                </p>
            )}
        </div>
    );
}

function SuccessState({ message }: { message: string }) {
    return (
        <div
            className="flex flex-col items-center p-10 text-center"
            style={{
                backgroundColor: 'var(--color-surface, #f9fafb)',
                borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                border: '1px solid var(--color-border, #e5e7eb)',
                animation: 'contactFadeIn 0.4s ease forwards',
            }}
        >
            <style>{`
                @keyframes contactFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div
                className="flex h-14 w-14 items-center justify-center"
                style={{
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary, #e94560)',
                    color: '#fff',
                    marginBottom: 16,
                }}
            >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <p
                className="text-base font-bold"
                style={{
                    fontFamily: 'var(--font-body, sans-serif)',
                    color: 'var(--color-foreground, #1a1a1a)',
                    letterSpacing: '-0.01em',
                }}
            >
                {message}
            </p>
        </div>
    );
}

export function Standard({ config, data }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const successMessage = (config.success_message as string) || "Thanks! We'll get back to you soon.";
    const shopSlug = config.shop_slug as string | undefined;

    const [formData, setFormData] = useState<FormState>({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [btnHovered, setBtnHovered] = useState(false);

    function handleChange(field: FieldName, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    function validate(): boolean {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.message.trim()) newErrors.message = 'Message is required';
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
            const result = await storefrontFetch(`/store/${slug}/api/contact`, {
                method: 'POST',
                json: { name: formData.name, email: formData.email, message: formData.message },
            });

            if (result.ok) {
                setIsSuccess(true);
                setFormData({ name: '', email: '', message: '' });
            } else {
                const responseData = result.data as Record<string, unknown>;
                setServerError((responseData.message as string) || 'Something went wrong. Please try again.');
            }
        } catch {
            setServerError('Unable to send your message. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <ScrollAnimation>
                    <div className="mx-auto max-w-xl">
                        {(heading || subheading) && (
                            <div className="mb-10 text-center">
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
                                {subheading && (
                                    <p
                                        className="mt-3"
                                        style={{
                                            fontSize: '1.05rem',
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-muted-foreground, #6b7280)',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {subheading}
                                    </p>
                                )}
                            </div>
                        )}

                        {isSuccess ? (
                            <SuccessState message={successMessage} />
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {serverError && (
                                    <div
                                        className="p-4 text-sm font-medium"
                                        style={{
                                            backgroundColor: 'color-mix(in srgb, var(--color-error, #dc2626) 8%, transparent)',
                                            color: 'var(--color-error, #dc2626)',
                                            borderRadius: 'var(--radius, 8px)',
                                            border: '1px solid color-mix(in srgb, var(--color-error, #dc2626) 25%, transparent)',
                                        }}
                                    >
                                        {serverError}
                                    </div>
                                )}

                                <FormField
                                    id="contact-name"
                                    label="Name"
                                    value={formData.name}
                                    onChange={(v) => handleChange('name', v)}
                                    error={errors.name}
                                    placeholder="Your name"
                                />

                                <FormField
                                    id="contact-email"
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(v) => handleChange('email', v)}
                                    error={errors.email}
                                    placeholder="you@example.com"
                                />

                                <FormField
                                    id="contact-message"
                                    label="Message"
                                    value={formData.message}
                                    onChange={(v) => handleChange('message', v)}
                                    error={errors.message}
                                    placeholder="How can we help?"
                                    multiline
                                />

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mt-2 w-full py-4 text-sm font-bold"
                                    style={{
                                        backgroundColor: btnHovered && !isSubmitting
                                            ? 'var(--color-foreground, #111)'
                                            : 'var(--color-primary, #e94560)',
                                        color: '#fff',
                                        borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        letterSpacing: '0.02em',
                                        border: 'none',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.7 : 1,
                                        transition: 'background-color 0.2s ease, opacity 0.2s ease',
                                    }}
                                    onMouseEnter={() => setBtnHovered(true)}
                                    onMouseLeave={() => setBtnHovered(false)}
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
