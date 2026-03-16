import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';
import type { AuthPageData, FixedPageProps } from '../../types/storefront';

export function VerifyEmailPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as AuthPageData;
    const [processing, setProcessing] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleResend() {
        setProcessing(true);
        setError('');

        const result = await storefrontFetch<{ message: string }>(
            `/store/${shop.slug}/api/auth/verify-email/resend`,
            { method: 'POST' },
        );

        if (result.ok) {
            setSent(true);
        } else {
            setError(result.data?.message ?? 'Could not resend verification email.');
        }
        setProcessing(false);
    }

    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
            <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%', backgroundColor: 'var(--color-primary, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#fff' }}>
                    &#9993;
                </div>

                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 12px' }}>
                    Verify Your Email
                </h1>

                <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
                    We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                </p>

                {error && (
                    <div style={{ padding: '10px 16px', marginBottom: '16px', backgroundColor: 'var(--color-destructive, #ef4444)', color: '#fff', borderRadius: 'var(--radius, 6px)', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                {sent ? (
                    <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-primary, #10b981)', color: '#fff', borderRadius: 'var(--radius, 6px)', fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>
                        Verification link sent! Check your inbox.
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={processing}
                        style={{
                            padding: '10px 24px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)',
                            backgroundColor: 'var(--color-surface, #fff)', color: 'var(--color-foreground, #111)',
                            fontWeight: 500, fontSize: '14px', cursor: processing ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-body)', marginBottom: '16px',
                            opacity: processing ? 0.6 : 1,
                        }}
                    >
                        {processing ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                )}

                <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                    <a href={`/store/${shop.slug}`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500 }}>
                        Back to shop
                    </a>
                </p>
            </div>
        </div>
    );
}
