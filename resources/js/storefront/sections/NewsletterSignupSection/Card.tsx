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
        <div className="mx-auto max-w-xl text-center">
            <div
                style={{
                    backgroundColor: 'var(--color-primary, #e94560)',
                    borderRadius: 'calc(var(--radius, 8px) * 2)',
                    padding: '56px 36px',
                }}
                className="sm:px-14 sm:py-16"
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: '#fff',
                        fontFamily: 'var(--font-heading, sans-serif)',
                        lineHeight: 1.2,
                    }}
                >
                    {heading}
                </h2>

                {subheading && (
                    <p
                        className="mx-auto mt-3 max-w-sm"
                        style={{
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.7)',
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        {subheading}
                    </p>
                )}

                {status === 'success' ? (
                    <div
                        className="mt-10 flex items-center justify-center gap-2.5"
                        style={{ animation: 'newsletterFadeIn 0.4s ease forwards' }}
                    >
                        <span
                            className="flex h-7 w-7 items-center justify-center shrink-0"
                            style={{
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                color: 'var(--color-primary, #e94560)',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                        <p className="text-sm font-bold" style={{ color: '#fff' }}>
                            You're subscribed!
                        </p>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="mx-auto mt-10 max-w-sm space-y-3"
                    >
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={placeholder}
                            required
                            className="w-full px-5 py-4 text-sm outline-none"
                            style={{
                                backgroundColor: '#fff',
                                color: 'var(--color-text, #1a1a1a)',
                                border: 'none',
                                borderRadius: 'var(--radius, 8px)',
                                fontFamily: 'var(--font-body, sans-serif)',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-4 text-sm font-bold"
                            style={{
                                backgroundColor: btnHovered
                                    ? 'var(--color-foreground, #000)'
                                    : 'rgba(0,0,0,0.85)',
                                color: '#fff',
                                borderRadius: 'var(--btn-radius, var(--radius, 8px))',
                                fontFamily: 'var(--font-body, sans-serif)',
                                letterSpacing: '0.01em',
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
                        className="mt-3 text-xs"
                        style={{ color: 'rgba(255,255,255,0.9)' }}
                    >
                        {errorMessage}
                    </p>
                )}

                <p
                    className="mt-5"
                    style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.45)',
                        fontFamily: 'var(--font-body, sans-serif)',
                    }}
                >
                    No spam, ever. Unsubscribe anytime.
                </p>
            </div>
        </div>
    );
}
