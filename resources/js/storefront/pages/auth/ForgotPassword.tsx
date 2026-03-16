import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';
import type { AuthPageData, FixedPageProps } from '../../types/storefront';

export function ForgotPasswordPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as AuthPageData;
    const [email, setEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const result = await storefrontFetch<{ message: string }>(
            `/store/${shop.slug}/api/auth/forgot-password`,
            { method: 'POST', json: { email } },
        );

        if (!result.ok && result.errors?.email) {
            setErrors(result.errors);
            setProcessing(false);
            return;
        }

        if (!result.ok) {
            setErrors({ email: ['Something went wrong. Please try again.'] });
            setProcessing(false);
            return;
        }

        setSuccess(true);
        setProcessing(false);
    }

    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 8px' }}>
                        Reset Password
                    </h1>
                    <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: 0 }}>
                        Enter your email and we&apos;ll send you a reset link.
                    </p>
                </div>

                <div style={{ padding: '32px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}>
                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'var(--color-primary, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff' }}>
                                &#10003;
                            </div>
                            <p style={{ fontSize: '15px', color: 'var(--color-foreground, #111)', margin: '0 0 8px', fontWeight: 500 }}>
                                Check your email
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)', margin: 0 }}>
                                If an account exists with that email, we&apos;ve sent a password reset link.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground, #111)', marginBottom: '4px' }}>
                                    Email<span style={{ color: 'var(--color-destructive, #ef4444)' }}> *</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={processing}
                                    required
                                    maxLength={255}
                                    autoComplete="email"
                                    style={{
                                        width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box',
                                        border: `1px solid ${errors.email ? 'var(--color-destructive, #ef4444)' : 'var(--color-border, #e5e7eb)'}`,
                                        borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)',
                                        color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-body)', outline: 'none',
                                    }}
                                />
                                {errors.email && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-destructive, #ef4444)' }}>{errors.email[0]}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    display: 'block', width: '100%', padding: '12px', border: 'none', borderRadius: 'var(--radius, 6px)',
                                    backgroundColor: processing ? 'var(--color-muted, #9ca3af)' : 'var(--color-primary, #111)',
                                    color: 'var(--color-primary-foreground, #fff)', fontWeight: 600, fontSize: '15px',
                                    cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
                                }}
                            >
                                {processing ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                    <a href={`/store/${shop.slug}/login`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500 }}>
                        Back to sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
