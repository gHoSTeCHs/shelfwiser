import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';
import type { FixedPageProps, LoginPageData } from '../../types/storefront';

export function LoginPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as LoginPageData;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const result = await storefrontFetch<{ customer: { id: number }; message: string }>(
            `/store/${shop.slug}/api/auth/login`,
            { method: 'POST', json: { email, password, remember } },
        );

        if (result.ok) {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect');
            const target = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : `/store/${shop.slug}`;
            window.location.href = target;
            return;
        }

        setErrors(result.errors ?? { email: [result.data?.message ?? 'Login failed.'] });
        setProcessing(false);
    }

    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 8px' }}>
                        Sign In
                    </h1>
                    <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: 0 }}>
                        Welcome back to {pageData.shop_name ?? shop.name}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ padding: '32px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}
                >
                    <AuthField label="Email" type="email" value={email} onChange={setEmail} error={errors.email?.[0]} disabled={processing} required maxLength={255} autoComplete="email" />
                    <AuthField label="Password" type="password" value={password} onChange={setPassword} error={errors.password?.[0]} disabled={processing} required maxLength={255} autoComplete="current-password" />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', fontSize: '13px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-foreground, #111)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={processing} />
                            Remember me
                        </label>
                        <a href={`/store/${shop.slug}/forgot-password`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none' }}>
                            Forgot password?
                        </a>
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
                        {processing ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {(pageData.registration_enabled ?? true) && (
                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                        Don&apos;t have an account?{' '}
                        <a href={`/store/${shop.slug}/register`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500 }}>
                            Create one
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
}

interface AuthFieldProps {
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
    autoComplete?: string;
}

function AuthField({ label, type, value, onChange, error, disabled, required, maxLength, autoComplete }: AuthFieldProps) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground, #111)', marginBottom: '4px' }}>
                {label}{required && <span style={{ color: 'var(--color-destructive, #ef4444)' }}> *</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                required={required}
                maxLength={maxLength}
                autoComplete={autoComplete}
                style={{
                    width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box',
                    border: `1px solid ${error ? 'var(--color-destructive, #ef4444)' : 'var(--color-border, #e5e7eb)'}`,
                    borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)',
                    color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-body)', outline: 'none',
                }}
            />
            {error && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-destructive, #ef4444)' }}>{error}</p>}
        </div>
    );
}
