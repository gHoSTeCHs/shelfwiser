import { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { AuthGatePrompt } from '../../components/AuthGatePrompt';
import { storefrontFetch } from '../../lib/fetch-client';
import type { AccountProfilePageData, FixedPageProps } from '../../types/storefront';

export function ProfilePage({ data, shop, customer }: FixedPageProps) {
    if (!customer) {
        return <AuthGatePrompt shop={shop} />;
    }

    const pageData = data as unknown as AccountProfilePageData;
    const profileData = pageData.customer;

    const [form, setForm] = useState({
        first_name: profileData?.first_name ?? '',
        last_name: profileData?.last_name ?? '',
        phone: profileData?.phone ?? '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);

    function updateField(field: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSuccess(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setSuccess(false);

        const result = await storefrontFetch<{ message: string }>(
            `/store/${shop.slug}/api/account/profile`,
            { method: 'PATCH', json: form },
        );

        if (result.ok) {
            setSuccess(true);
        } else {
            setErrors(result.errors ?? { first_name: [result.data?.message ?? 'Update failed.'] });
        }
        setProcessing(false);
    }

    return (
        <AccountLayout shop={shop} activeItem="profile">
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 24px' }}>
                My Profile
            </h1>

            <div style={{ maxWidth: '520px' }}>
                <form
                    onSubmit={handleSubmit}
                    style={{ padding: '32px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}
                >
                    {success && (
                        <div style={{ padding: '10px 16px', marginBottom: '16px', backgroundColor: 'var(--color-primary, #10b981)', color: '#fff', borderRadius: 'var(--radius, 6px)', fontSize: '14px', fontWeight: 500 }}>
                            Profile updated successfully.
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-foreground, #111)', marginBottom: '4px' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={profileData?.email ?? ''}
                            disabled
                            style={{
                                width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box',
                                border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)',
                                backgroundColor: 'var(--color-muted, #f3f4f6)', color: 'var(--color-muted-foreground, #6b7280)',
                                fontFamily: 'var(--font-body)', outline: 'none',
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                        <ProfileField label="First Name" value={form.first_name} onChange={(v) => updateField('first_name', v)} error={errors.first_name?.[0]} disabled={processing} required maxLength={255} />
                        <ProfileField label="Last Name" value={form.last_name} onChange={(v) => updateField('last_name', v)} error={errors.last_name?.[0]} disabled={processing} required maxLength={255} />
                    </div>

                    <ProfileField label="Phone" type="tel" value={form.phone} onChange={(v) => updateField('phone', v)} error={errors.phone?.[0]} disabled={processing} maxLength={50} />

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
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </AccountLayout>
    );
}

interface ProfileFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
}

function ProfileField({ label, type = 'text', value, onChange, error, disabled, required, maxLength }: ProfileFieldProps) {
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
