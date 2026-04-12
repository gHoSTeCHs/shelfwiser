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

interface ContactData {
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
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
        <div className="flex flex-1 flex-col gap-2">
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

function ContactInfoItem({
    iconPath,
    children,
}: {
    iconPath: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-4">
            <span
                className="flex h-10 w-10 shrink-0 items-center justify-center"
                style={{
                    borderRadius: '50%',
                    backgroundColor: 'color-mix(in srgb, var(--color-primary, #e94560) 10%, transparent)',
                    color: 'var(--color-primary, #e94560)',
                }}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d={iconPath} />
                </svg>
            </span>
            <div className="pt-2">{children}</div>
        </div>
    );
}

const icons = {
    email: 'M2 6a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0l8 5 8-5',
    phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
};

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

export function SplitLayout({ config, data }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const successMessage = (config.success_message as string) || "Thanks! We'll get back to you soon.";
    const shopSlug = config.shop_slug as string | undefined;
    const contactData = (data as ContactData) || {};

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
            const slug = shopSlug || '';
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

    const hasContactInfo = contactData.phone || contactData.email || contactData.address;
    const addressParts = [contactData.address, contactData.city, contactData.state, contactData.country].filter(Boolean);

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <div className="flex flex-col gap-12 md:flex-row md:gap-16 lg:gap-20">
                    {/* Left: heading + contact info */}
                    <ScrollAnimation className="w-full md:w-5/12">
                        <div className="flex flex-col gap-6">
                            {heading && (
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                        fontWeight: 800,
                                        letterSpacing: '-0.03em',
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
                                    style={{
                                        fontSize: '1.05rem',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        color: 'var(--color-muted-foreground, #6b7280)',
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {subheading}
                                </p>
                            )}

                            {hasContactInfo && (
                                <div
                                    className="mt-2 flex flex-col gap-5 pt-6"
                                    style={{ borderTop: '1px solid var(--color-border, #e5e7eb)' }}
                                >
                                    {contactData.email && (
                                        <ContactInfoItem iconPath={icons.email}>
                                            <p className="text-[11px] font-bold uppercase" style={{ letterSpacing: '0.06em', color: 'var(--color-muted-foreground, #9ca3af)', marginBottom: 2 }}>Email</p>
                                            <a
                                                href={`mailto:${contactData.email}`}
                                                className="text-sm font-semibold"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-foreground, #1a1a1a)',
                                                }}
                                            >
                                                {contactData.email}
                                            </a>
                                        </ContactInfoItem>
                                    )}

                                    {contactData.phone && (
                                        <ContactInfoItem iconPath={icons.phone}>
                                            <p className="text-[11px] font-bold uppercase" style={{ letterSpacing: '0.06em', color: 'var(--color-muted-foreground, #9ca3af)', marginBottom: 2 }}>Phone</p>
                                            <a
                                                href={`tel:${contactData.phone}`}
                                                className="text-sm font-semibold"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-foreground, #1a1a1a)',
                                                }}
                                            >
                                                {contactData.phone}
                                            </a>
                                        </ContactInfoItem>
                                    )}

                                    {addressParts.length > 0 && (
                                        <ContactInfoItem iconPath={icons.location}>
                                            <p className="text-[11px] font-bold uppercase" style={{ letterSpacing: '0.06em', color: 'var(--color-muted-foreground, #9ca3af)', marginBottom: 2 }}>Address</p>
                                            <p
                                                className="text-sm font-semibold"
                                                style={{
                                                    fontFamily: 'var(--font-body, sans-serif)',
                                                    color: 'var(--color-foreground, #1a1a1a)',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {addressParts.join(', ')}
                                            </p>
                                        </ContactInfoItem>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollAnimation>

                    {/* Right: form */}
                    <ScrollAnimation className="w-full md:w-7/12" delay={150}>
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

                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <FormField
                                        id="split-contact-name"
                                        label="Name"
                                        value={formData.name}
                                        onChange={(v) => handleChange('name', v)}
                                        error={errors.name}
                                        placeholder="Your name"
                                    />
                                    <FormField
                                        id="split-contact-email"
                                        label="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(v) => handleChange('email', v)}
                                        error={errors.email}
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <FormField
                                    id="split-contact-message"
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
                                    className="mt-2 px-8 py-4 text-sm font-bold sm:self-start"
                                    style={{
                                        backgroundColor: btnHovered && !isSubmitting
                                            ? 'var(--color-foreground, #111)'
                                            : 'var(--color-primary, #e94560)',
                                        color: '#fff',
                                        borderRadius: 'var(--radius, 8px)',
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
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
}
