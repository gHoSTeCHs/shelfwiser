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

export function Inline({ heading, subheading, placeholder, button_text, shop_slug }: InlineProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [btnHovered, setBtnHovered] = useState(false);

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
        <div
            style={{
                backgroundColor: 'var(--color-primary, #e94560)',
                borderRadius: 'calc(var(--radius, 8px) * 2)',
                padding: '48px 32px',
            }}
            className="sm:px-12 sm:py-14"
        >
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
                {/* Text side */}
                <div className="text-center sm:text-left">
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            color: '#fff',
                            fontFamily: 'var(--font-heading, sans-serif)',
                        }}
                    >
                        {heading}
                    </h2>
                    {subheading && (
                        <p
                            style={{
                                marginTop: 8,
                                fontSize: 14,
                                color: 'rgba(255,255,255,0.75)',
                                fontFamily: 'var(--font-body, sans-serif)',
                            }}
                        >
                            {subheading}
                        </p>
                    )}
                </div>

                {/* Form side */}
                <div className="w-full sm:w-auto">
                    {status === 'success' ? (
                        <div
                            className="flex items-center gap-2.5 justify-center sm:justify-start"
                            style={{ animation: 'newsletterFadeIn 0.4s ease forwards' }}
                        >
                            <span
                                className="flex h-6 w-6 items-center justify-center shrink-0"
                                style={{
                                    borderRadius: '50%',
                                    backgroundColor: '#fff',
                                    color: 'var(--color-primary, #e94560)',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                            <p className="text-sm font-semibold" style={{ color: '#fff' }}>
                                You're subscribed!
                            </p>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="flex w-full gap-0 sm:w-auto"
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 'var(--radius, 8px)',
                                padding: 4,
                            }}
                        >
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={placeholder}
                                required
                                className="min-w-0 flex-1 px-4 py-3 text-sm outline-none sm:w-56"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text, #1a1a1a)',
                                    border: 'none',
                                    fontFamily: 'var(--font-body, sans-serif)',
                                    borderRadius: 'var(--radius, 8px)',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="shrink-0 px-6 py-3 text-sm font-bold"
                                style={{
                                    backgroundColor: btnHovered
                                        ? 'var(--color-foreground, #111)'
                                        : 'var(--color-primary, #e94560)',
                                    color: '#fff',
                                    borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                    fontFamily: 'var(--font-body, sans-serif)',
                                    opacity: status === 'loading' ? 0.7 : 1,
                                    transition: 'background-color 0.2s ease, opacity 0.2s ease',
                                }}
                                onMouseEnter={() => setBtnHovered(true)}
                                onMouseLeave={() => setBtnHovered(false)}
                            >
                                {status === 'loading' ? 'Sending...' : button_text}
                            </button>
                        </form>
                    )}
                    {status === 'error' && errorMessage && (
                        <p
                            className="mt-2 text-xs"
                            style={{ color: 'rgba(255,255,255,0.9)' }}
                        >
                            {errorMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
