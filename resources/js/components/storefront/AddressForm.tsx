import React from 'react';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';

interface AddressData {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
}

interface AddressFormProps {
    prefix: string;
    data: AddressData;
    onChange: (field: string, value: string) => void;
    errors: Record<string, string>;
    required?: boolean;
}

/**
 * Reusable address input form component.
 * Can be used in checkout, profile, and other address collection contexts.
 */
const AddressForm: React.FC<AddressFormProps> = ({
    prefix,
    data,
    onChange,
    errors,
    required = true,
}) => {
    const getFieldName = (field: string) => `${prefix}[${field}]`;
    const getFieldValue = (field: keyof AddressData) => data[field] || '';
    const getFieldError = (field: string) => errors[`${prefix}.${field}`];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`${prefix}_first_name`}>
                        First Name {required && <span className="text-error-500">*</span>}
                    </Label>
                    <Input
                        id={`${prefix}_first_name`}
                        name={getFieldName('first_name')}
                        type="text"
                        value={getFieldValue('first_name')}
                        onChange={(e) => onChange('first_name', e.target.value)}
                        error={!!getFieldError('first_name')}
                        required={required}
                    />
                    <InputError message={getFieldError('first_name')} />
                </div>

                <div>
                    <Label htmlFor={`${prefix}_last_name`}>
                        Last Name {required && <span className="text-error-500">*</span>}
                    </Label>
                    <Input
                        id={`${prefix}_last_name`}
                        name={getFieldName('last_name')}
                        type="text"
                        value={getFieldValue('last_name')}
                        onChange={(e) => onChange('last_name', e.target.value)}
                        error={!!getFieldError('last_name')}
                        required={required}
                    />
                    <InputError message={getFieldError('last_name')} />
                </div>
            </div>

            <div>
                <Label htmlFor={`${prefix}_phone`}>
                    Phone Number {required && <span className="text-error-500">*</span>}
                </Label>
                <Input
                    id={`${prefix}_phone`}
                    name={getFieldName('phone')}
                    type="tel"
                    value={getFieldValue('phone')}
                    onChange={(e) => onChange('phone', e.target.value)}
                    error={!!getFieldError('phone')}
                    required={required}
                />
                <InputError message={getFieldError('phone')} />
            </div>

            <div>
                <Label htmlFor={`${prefix}_address_line_1`}>
                    Address Line 1 {required && <span className="text-error-500">*</span>}
                </Label>
                <Input
                    id={`${prefix}_address_line_1`}
                    name={getFieldName('address_line_1')}
                    type="text"
                    value={getFieldValue('address_line_1')}
                    onChange={(e) => onChange('address_line_1', e.target.value)}
                    error={!!getFieldError('address_line_1')}
                    required={required}
                />
                <InputError message={getFieldError('address_line_1')} />
            </div>

            <div>
                <Label htmlFor={`${prefix}_address_line_2`}>Address Line 2</Label>
                <Input
                    id={`${prefix}_address_line_2`}
                    name={getFieldName('address_line_2')}
                    type="text"
                    value={getFieldValue('address_line_2')}
                    onChange={(e) => onChange('address_line_2', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`${prefix}_city`}>
                        City {required && <span className="text-error-500">*</span>}
                    </Label>
                    <Input
                        id={`${prefix}_city`}
                        name={getFieldName('city')}
                        type="text"
                        value={getFieldValue('city')}
                        onChange={(e) => onChange('city', e.target.value)}
                        error={!!getFieldError('city')}
                        required={required}
                    />
                    <InputError message={getFieldError('city')} />
                </div>

                <div>
                    <Label htmlFor={`${prefix}_state`}>
                        State/Province {required && <span className="text-error-500">*</span>}
                    </Label>
                    <Input
                        id={`${prefix}_state`}
                        name={getFieldName('state')}
                        type="text"
                        value={getFieldValue('state')}
                        onChange={(e) => onChange('state', e.target.value)}
                        error={!!getFieldError('state')}
                        required={required}
                    />
                    <InputError message={getFieldError('state')} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`${prefix}_postal_code`}>Postal Code</Label>
                    <Input
                        id={`${prefix}_postal_code`}
                        name={getFieldName('postal_code')}
                        type="text"
                        value={getFieldValue('postal_code')}
                        onChange={(e) => onChange('postal_code', e.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor={`${prefix}_country`}>
                        Country {required && <span className="text-error-500">*</span>}
                    </Label>
                    <Input
                        id={`${prefix}_country`}
                        name={getFieldName('country')}
                        type="text"
                        value={getFieldValue('country')}
                        onChange={(e) => onChange('country', e.target.value)}
                        error={!!getFieldError('country')}
                        required={required}
                    />
                    <InputError message={getFieldError('country')} />
                </div>
            </div>
        </div>
    );
};

export default AddressForm;
