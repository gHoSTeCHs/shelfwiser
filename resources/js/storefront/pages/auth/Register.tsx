import { useState } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';
import type { FixedPageProps, RegisterPageData } from '../../types/storefront';

export function RegisterPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as RegisterPageData;
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    function updateField(field: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const result = await storefrontFetch<{ customer: { id: number }; message: string }>(
            `/store/${shop.slug}/api/auth/register`,
            { method: 'POST', json: form },
        );

        if (result.ok) {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect');
            const target = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : `/store/${shop.slug}`;
            window.location.href = target;
            return;
        }

        setErrors(result.errors ?? { email: [result.data?.message ?? 'Registration failed.'] });
        setProcessing(false);
    }

    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 8px' }}>
                        Create Account
                    </h1>
                    <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: 0 }}>
                        Join {pageData.shop_name ?? shop.name}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ padding: '32px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}
                >
                    <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                        <RegField label="First Name" value={form.first_name} onChange={(v) => updateField('first_name', v)} error={errors.first_name?.[0]} disabled={processing} required maxLength={255} autoComplete="given-name" />
                        <RegField label="Last Name" value={form.last_name} onChange={(v) => updateField('last_name', v)} error={errors.last_name?.[0]} disabled={processing} required maxLength={255} autoComplete="family-name" />
                    </div>
                    <RegField label="Email" type="email" value={form.email} onChange={(v) => updateField('email', v)} error={errors.email?.[0]} disabled={processing} required maxLength={255} autoComplete="email" />
                    <RegField label="Phone" type="tel" value={form.phone} onChange={(v) => updateField('phone', v)} error={errors.phone?.[0]} disabled={processing} maxLength={50} autoComplete="tel" />
                    <RegField label="Password" type="password" value={form.password} onChange={(v) => updateField('password', v)} error={errors.password?.[0]} disabled={processing} required maxLength={255} autoComplete="new-password" />
                    <RegField label="Confirm Password" type="password" value={form.password_confirmation} onChange={(v) => updateField('password_confirmation', v)} error={errors.password_confirmation?.[0]} disabled={processing} required maxLength={255} autoComplete="new-password" />

                    <button
                        type="submit"
                        disabled={processing}
                        style={{
                            display: 'block', width: '100%', padding: '12px', marginTop: '8px', border: 'none', borderRadius: 'var(--radius, 6px)',
                            backgroundColor: processing ? 'var(--color-muted, #9ca3af)' : 'var(--color-primary, #111)',
                            color: 'var(--color-primary-foreground, #fff)', fontWeight: 600, fontSize: '15px',
                            cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
                        }}
                    >
                        {processing ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                    Already have an account?{' '}
                    <a href={`/store/${shop.slug}/login`} style={{ color: 'var(--color-primary, #111)', textDecoration: 'none', fontWeight: 500 }}>
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}

interface RegFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
    autoComplete?: string;
}

function RegField({ label, type = 'text', value, onChange, error, disabled, required, maxLength, autoComplete }: RegFieldProps) {
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
