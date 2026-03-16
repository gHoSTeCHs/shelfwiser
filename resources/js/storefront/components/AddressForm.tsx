import type { ShippingAddress } from '../types/storefront';

interface AddressFormProps {
    address: ShippingAddress;
    onChange: (address: ShippingAddress) => void;
    errors?: Record<string, string[]>;
    disabled?: boolean;
    prefix?: string;
}

export function AddressForm({ address, onChange, errors = {}, disabled = false, prefix = 'shipping_address' }: AddressFormProps) {
    function updateField(field: keyof ShippingAddress, value: string) {
        onChange({ ...address, [field]: value });
    }

    function getError(field: string): string | undefined {
        const key = `${prefix}.${field}`;
        return errors[key]?.[0];
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ fontFamily: 'var(--font-body)' }}>
            <FormField label="First Name" value={address.first_name} onChange={(v) => updateField('first_name', v)} error={getError('first_name')} disabled={disabled} required maxLength={255} />
            <FormField label="Last Name" value={address.last_name} onChange={(v) => updateField('last_name', v)} error={getError('last_name')} disabled={disabled} required maxLength={255} />
            <FormField label="Phone" value={address.phone} onChange={(v) => updateField('phone', v)} error={getError('phone')} disabled={disabled} required maxLength={50} />
            <FormField label="Address" value={address.address_line_1} onChange={(v) => updateField('address_line_1', v)} error={getError('address_line_1')} disabled={disabled} required fullWidth maxLength={255} />
            <FormField label="Address Line 2" value={address.address_line_2} onChange={(v) => updateField('address_line_2', v)} disabled={disabled} fullWidth maxLength={255} />
            <FormField label="City" value={address.city} onChange={(v) => updateField('city', v)} error={getError('city')} disabled={disabled} required maxLength={100} />
            <FormField label="State" value={address.state} onChange={(v) => updateField('state', v)} error={getError('state')} disabled={disabled} required maxLength={100} />
            <FormField label="Postal Code" value={address.postal_code} onChange={(v) => updateField('postal_code', v)} disabled={disabled} maxLength={20} />
            <FormField label="Country" value={address.country} onChange={(v) => updateField('country', v)} error={getError('country')} disabled={disabled} required maxLength={100} />
        </div>
    );
}

interface FormFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    fullWidth?: boolean;
    maxLength?: number;
}

function FormField({ label, value, onChange, error, disabled, required, fullWidth, maxLength }: FormFieldProps) {
    return (
        <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--color-foreground, #111)',
                    marginBottom: '4px',
                }}
            >
                {label}
                {required && <span style={{ color: 'var(--color-destructive, #ef4444)' }}> *</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                maxLength={maxLength}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: `1px solid ${error ? 'var(--color-destructive, #ef4444)' : 'var(--color-border, #e5e7eb)'}`,
                    borderRadius: 'var(--radius, 6px)',
                    backgroundColor: 'var(--color-surface, #fff)',
                    color: 'var(--color-foreground, #111)',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
            />
            {error && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-destructive, #ef4444)' }}>
                    {error}
                </p>
            )}
        </div>
    );
}
