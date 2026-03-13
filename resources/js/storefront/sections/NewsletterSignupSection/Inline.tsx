import type React from 'react';
import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';

interface InlineProps {
    heading: string;
    subheading?: string;
    placeholder: string;
    button_text: string;
    shop_slug: string;
}

export function Inline({ heading, placeholder, button_text, shop_slug }: InlineProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

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
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <h2
                className="text-lg font-bold sm:text-xl"
                style={{
                    color: 'var(--color-text, #1a1a1a)',
                    fontFamily: 'var(--font-heading, sans-serif)',
                    fontWeight: 'var(--font-heading-weight, 700)',
                }}
            >
                {heading}
            </h2>

            <div className="w-full sm:w-auto">
                {status === 'success' ? (
                    <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-success, #22c55e)' }}
                    >
                        Thank you for subscribing!
                    </p>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="flex w-full gap-2 sm:w-auto"
                    >
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={placeholder}
                            required
                            className="min-w-0 flex-1 px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 sm:w-64"
                            style={{
                                backgroundColor: 'var(--color-surface, #f5f5f5)',
                                color: 'var(--color-text, #1a1a1a)',
                                border: '1px solid var(--color-border, #e5e5e5)',
                                borderRadius: 'var(--radius, 8px)',
                                fontFamily: 'var(--font-body, sans-serif)',
                                outlineColor: 'var(--color-primary, #1a1a1a)',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="shrink-0 px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
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
                        className="mt-2 text-xs"
                        style={{ color: 'var(--color-error, #ef4444)' }}
                    >
                        {errorMessage}
                    </p>
                )}
            </div>
        </div>
    );
}
