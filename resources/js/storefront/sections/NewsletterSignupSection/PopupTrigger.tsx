import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';

interface PopupTriggerProps {
    heading: string;
    subheading?: string;
    placeholder: string;
    button_text: string;
    shop_slug: string;
}

export function PopupTrigger({ heading, subheading, placeholder, button_text, shop_slug }: PopupTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        },
        [],
    );

    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim() || status === 'loading') return;

        setStatus('loading');
        setErrorMessage('');

        const result = await storefrontFetch(`/store/${shop_slug}/api/newsletter`, {
            method: 'POST',
            json: { email },
        });

        if (result.ok) {
            setStatus('success');
            setEmail('');
        } else {
            setStatus('error');
            const fieldErrors = result.errors?.email;
            setErrorMessage(
                fieldErrors ? fieldErrors[0] : 'Something went wrong. Please try again.',
            );
        }
    }

    return (
        <>
            <div
                className="flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between sm:px-6"
                style={{
                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                    borderRadius: 'var(--radius, 8px)',
                    border: '1px solid var(--color-border, #e5e5e5)',
                }}
            >
                <p
                    className="text-sm font-semibold sm:text-base"
                    style={{
                        color: 'var(--color-text, #1a1a1a)',
                        fontFamily: 'var(--font-heading, sans-serif)',
                    }}
                >
                    {heading}
                </p>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="shrink-0 px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{
                        backgroundColor: 'var(--color-primary, #1a1a1a)',
                        color: 'var(--color-primary-foreground, #ffffff)',
                        borderRadius: 'var(--radius, 8px)',
                        fontFamily: 'var(--font-body, sans-serif)',
                    }}
                >
                    Subscribe
                </button>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                    onClick={() => setIsOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Newsletter signup"
                >
                    <div
                        className="relative w-full max-w-md p-8 sm:p-10"
                        style={{
                            backgroundColor: 'var(--color-background, #ffffff)',
                            borderRadius: 'var(--radius, 8px)',
                            border: '1px solid var(--color-border, #e5e5e5)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
                            style={{ color: 'var(--color-text-muted, #666)' }}
                            aria-label="Close popup"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="text-center">
                            <h2
                                className="text-xl font-bold sm:text-2xl"
                                style={{
                                    color: 'var(--color-text, #1a1a1a)',
                                    fontFamily: 'var(--font-heading, sans-serif)',
                                    fontWeight: 'var(--font-heading-weight, 700)',
                                }}
                            >
                                {heading}
                            </h2>

                            {subheading && (
                                <p
                                    className="mx-auto mt-2 max-w-sm text-sm"
                                    style={{
                                        color: 'var(--color-text-muted, #666)',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                    }}
                                >
                                    {subheading}
                                </p>
                            )}

                            {status === 'success' ? (
                                <p
                                    className="mt-6 text-sm font-medium"
                                    style={{ color: 'var(--color-success, #22c55e)' }}
                                >
                                    Thank you for subscribing!
                                </p>
                            ) : (
                                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={placeholder}
                                        required
                                        className="w-full px-4 py-3 text-sm outline-none transition-shadow focus:ring-2"
                                        style={{
                                            backgroundColor: 'var(--color-surface, #f5f5f5)',
                                            color: 'var(--color-text, #1a1a1a)',
                                            border: '1px solid var(--color-border, #e5e5e5)',
                                            borderRadius: 'var(--radius, 8px)',
                                            fontFamily: 'var(--font-body, sans-serif)',
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                                        style={{
                                            backgroundColor: 'var(--color-primary, #1a1a1a)',
                                            color: 'var(--color-primary-foreground, #ffffff)',
                                            borderRadius: 'var(--radius, 8px)',
                                            fontFamily: 'var(--font-body, sans-serif)',
                                        }}
                                    >
                                        {status === 'loading' ? 'Sending...' : button_text}
                                    </button>
                                </form>
                            )}
                            {status === 'error' && errorMessage && (
                                <p
                                    className="mt-3 text-xs"
                                    style={{ color: 'var(--color-error, #ef4444)' }}
                                >
                                    {errorMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
