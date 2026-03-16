import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';
import type { FixedPageProps, ResetPasswordPageData } from '../../types/storefront';

export function ResetPasswordPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as ResetPasswordPageData;
    const email = pageData.email ?? '';
    const token = pageData.token ?? '';
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);

    if (!token || !email) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
                <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-foreground, #111)', margin: '0 0 12px' }}>
                        Invalid or Expired Link
                    </h2>
                    <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: '0 0 24px' }}>
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <a href={`/store/${shop.slug}/forgot-password`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
                        Request New Reset Link
                    </a>
                </div>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const result = await storefrontFetch<{ message: string }>(
            `/store/${shop.slug}/api/auth/reset-password`,
            {
                method: 'POST',
                json: {
                    token,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                },
            },
        );

        if (result.ok) {
            setSuccess(true);
        } else {
            setErrors(result.errors ?? { email: [result.data?.message ?? 'Password reset failed.'] });
        }
        setProcessing(false);
    }

    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 8px' }}>
                        Set New Password
                    </h1>
                </div>

                <div style={{ padding: '32px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}>
                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff' }}>
                                &#10003;
                            </div>
                            <p style={{ fontSize: '15px', color: 'var(--color-foreground, #111)', margin: '0 0 12px', fontWeight: 500 }}>
                                Password reset successfully
                            </p>
                            <a
                                href={`/store/${shop.slug}/login`}
                                style={{
                                    display: 'inline-block', padding: '10px 24px', borderRadius: 'var(--radius, 6px)',
                                    backgroundColor: 'var(--color-primary, #111)', color: 'var(--color-primary-foreground, #fff)',
                                    textDecoration: 'none', fontWeight: 500, fontSize: '14px',
                                }}
                            >
                                Sign In
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground, #111)', marginBottom: '4px' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    style={{
                                        width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box',
                                        border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)',
                                        backgroundColor: 'var(--color-muted, #f3f4f6)', color: 'var(--color-muted-foreground, #6b7280)',
                                        fontFamily: 'var(--font-body)', outline: 'none',
                                    }}
                                />
                                {errors.email && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-destructive, #ef4444)' }}>{errors.email[0]}</p>}
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground, #111)', marginBottom: '4px' }}>
                                    New Password<span style={{ color: 'var(--color-destructive, #ef4444)' }}> *</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={processing}
                                    required
                                    maxLength={255}
                                    autoComplete="new-password"
                                    style={{
                                        width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box',
                                        border: `1px solid ${errors.password ? 'var(--color-destructive, #ef4444)' : 'var(--color-border, #e5e7eb)'}`,
                                        borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)',
                                        color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-body)', outline: 'none',
                                    }}
                                />
                                {errors.password && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-destructive, #ef4444)' }}>{errors.password[0]}</p>}
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground, #111)', marginBottom: '4px' }}>
                                    Confirm Password<span style={{ color: 'var(--color-destructive, #ef4444)' }}> *</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    disabled={processing}
                                    required
                                    maxLength={255}
                                    autoComplete="new-password"
                                    style={{
                                        width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box',
                                        border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)',
                                        backgroundColor: 'var(--color-surface, #fff)', color: 'var(--color-foreground, #111)',
                                        fontFamily: 'var(--font-body)', outline: 'none',
                                    }}
                                />
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
                                {processing ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
