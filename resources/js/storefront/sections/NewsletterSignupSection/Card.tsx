import type React from 'react';
import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';

interface CardProps {
    heading: string;
    subheading?: string;
    placeholder: string;
    button_text: string;
    shop_slug: string;
}

export function Card({ heading, subheading, placeholder, button_text, shop_slug }: CardProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim() || status === 'loading') return;

        setStatus('loading');
        setErrorMessage('');

        const result = await storefrontFetch(`/${shop_slug}/api/newsletter`, {
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
        <div className="mx-auto max-w-lg text-center">
            <div
                className="p-8 sm:p-10"
                style={{
                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                    borderRadius: 'var(--radius, 8px)',
                    border: '1px solid var(--color-border, #e5e5e5)',
                }}
            >
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
                                backgroundColor: 'var(--color-background, #ffffff)',
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
    );
}
