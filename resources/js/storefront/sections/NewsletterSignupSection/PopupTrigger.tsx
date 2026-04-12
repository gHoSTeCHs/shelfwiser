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
    const [triggerHovered, setTriggerHovered] = useState(false);
    const [submitHovered, setSubmitHovered] = useState(false);

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
            {/* Trigger bar */}
            <div
                className="flex flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between sm:px-8"
                style={{
                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                    border: '1px solid var(--color-border, #e5e5e5)',
                }}
            >
                <p
                    className="text-sm font-bold sm:text-[15px]"
                    style={{
                        color: 'var(--color-text, #1a1a1a)',
                        fontFamily: 'var(--font-heading, sans-serif)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {heading}
                </p>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="shrink-0 px-7 py-3 text-sm font-bold"
                    style={{
                        backgroundColor: triggerHovered
                            ? 'var(--color-foreground, #111)'
                            : 'var(--color-primary, #e94560)',
                        color: '#fff',
                        borderRadius: 'var(--radius, 8px)',
                        fontFamily: 'var(--font-body, sans-serif)',
                        transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={() => setTriggerHovered(true)}
                    onMouseLeave={() => setTriggerHovered(false)}
                >
                    Subscribe
                </button>
            </div>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        animation: 'newsletterOverlayIn 0.2s ease forwards',
                    }}
                    onClick={() => setIsOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Newsletter signup"
                >
                    <style>{`
                        @keyframes newsletterOverlayIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes newsletterCardIn {
                            from { opacity: 0; transform: translateY(12px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>

                    <div
                        className="relative w-full max-w-md text-center"
                        style={{
                            backgroundColor: 'var(--color-primary, #e94560)',
                            borderRadius: 'calc(var(--radius, 8px) * 2)',
                            padding: '52px 36px',
                            animation: 'newsletterCardIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center"
                            style={{
                                color: 'rgba(255,255,255,0.5)',
                                borderRadius: '50%',
                                transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                            aria-label="Close"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <h2
                            style={{
                                margin: 0,
                                fontSize: 'clamp(1.4rem, 3vw, 1.75rem)',
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
                                className="mx-auto mt-3 max-w-xs"
                                style={{
                                    fontSize: 14,
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
                            <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-sm space-y-3">
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
                                        backgroundColor: submitHovered
                                            ? 'var(--color-foreground, #000)'
                                            : 'rgba(0,0,0,0.85)',
                                        color: '#fff',
                                        borderRadius: 'var(--radius, 8px)',
                                        fontFamily: 'var(--font-body, sans-serif)',
                                        opacity: status === 'loading' ? 0.7 : 1,
                                        transition: 'background-color 0.2s ease, opacity 0.2s ease',
                                    }}
                                    onMouseEnter={() => setSubmitHovered(true)}
                                    onMouseLeave={() => setSubmitHovered(false)}
                                >
                                    {status === 'loading' ? 'Sending...' : button_text}
                                </button>
                            </form>
                        )}
                        {status === 'error' && errorMessage && (
                            <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                                {errorMessage}
                            </p>
                        )}

                        <p
                            className="mt-5"
                            style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.4)',
                                fontFamily: 'var(--font-body, sans-serif)',
                            }}
                        >
                            No spam, ever. Unsubscribe anytime.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
