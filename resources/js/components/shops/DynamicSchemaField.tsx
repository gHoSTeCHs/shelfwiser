import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';

type SchemaPropertyValue =
    | string
    | number
    | boolean
    | null
    | string[]
    | number[];

interface SchemaProperty {
    type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
    title?: string;
    default?: SchemaPropertyValue;
    enum?: SchemaPropertyValue[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    items?: {
        type?: string;
        enum?: SchemaPropertyValue[];
    };
}

interface DynamicSchemaFieldProps {
    fieldName: string;
    schema: SchemaProperty;
    value: SchemaPropertyValue;
    onChange: (value: SchemaPropertyValue) => void;
    error?: string;
    required?: boolean;
}

export default function DynamicSchemaField({
    fieldName,
    schema,
    value,
    onChange,
    error,
    required = false,
}: DynamicSchemaFieldProps) {
    const displayName = schema.title || fieldName.replace(/_/g, ' ');
    const fieldId = `config_${fieldName}`;

    const asBooleanValue = (val: SchemaPropertyValue): boolean => {
        if (typeof val === 'boolean') return val;
        return false;
    };

    const asStringOrNumberValue = (val: SchemaPropertyValue): string | number => {
        if (typeof val === 'string' || typeof val === 'number') return val;
        return '';
    };

    const asStringArrayValue = (val: SchemaPropertyValue): string[] => {
        if (Array.isArray(val)) return val.map(String);
        return [];
    };

    const asStringValue = (val: SchemaPropertyValue): string => {
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        return '';
    };

    const renderField = () => {
        switch (schema.type) {
            case 'boolean':
                return (
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id={fieldId}
                            name={fieldName}
                            checked={asBooleanValue(value ?? schema.default ?? false)}
                            onChange={(checked) => onChange(checked)}
                        />
                        <Label
                            htmlFor={fieldId}
                            className="mb-0 font-normal text-gray-700 dark:text-gray-400"
                        >
                            {displayName}
                            {required && (
                                <span className="ml-1 text-error-500">*</span>
                            )}
                        </Label>
                    </div>
                );

            case 'integer':
            case 'number':
                return (
                    <div>
                        <Label htmlFor={fieldId}>
                            {displayName}
                            {required && (
                                <span className="text-error-500"> *</span>
                            )}
                        </Label>
                        <Input
                            type="number"
                            id={fieldId}
                            name={fieldName}
                            value={asStringOrNumberValue(value ?? schema.default ?? '')}
                            onChange={(e) => {
                                const val =
                                    schema.type === 'integer'
                                        ? parseInt(e.target.value)
                                        : parseFloat(e.target.value);
                                onChange(isNaN(val) ? '' : val);
                            }}
                            min={schema.minimum}
                            max={schema.maximum}
                            step={schema.type === 'integer' ? 1 : 0.01}
                            error={!!error}
                            required={required}
                        />
                        {error && <InputError message={error} />}
                        {(schema.minimum !== undefined ||
                            schema.maximum !== undefined) && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {schema.minimum !== undefined &&
                                    schema.maximum !== undefined &&
                                    `Range: ${schema.minimum} - ${schema.maximum}`}
                                {schema.minimum !== undefined &&
                                    schema.maximum === undefined &&
                                    `Minimum: ${schema.minimum}`}
                                {schema.minimum === undefined &&
                                    schema.maximum !== undefined &&
                                    `Maximum: ${schema.maximum}`}
                            </p>
                        )}
                    </div>
                );

            case 'array':
                if (schema.items?.enum) {
                    const enumOptions = schema.items.enum.map(String);
                    const currentArrayValues = asStringArrayValue(value ?? schema.default ?? []);
                    return (
                        <div>
                            <Label htmlFor={fieldId}>
                                {displayName}
                                {required && (
                                    <span className="text-error-500"> *</span>
                                )}
                            </Label>
                            <div className="space-y-2">
                                {enumOptions.map((option) => (
                                    <div
                                        key={option}
                                        className="flex items-center gap-3"
                                    >
                                        <Checkbox
                                            id={`${fieldId}_${option}`}
                                            name={`${fieldName}[]`}
                                            checked={currentArrayValues.includes(option)}
                                            onChange={(checked) => {
                                                if (checked) {
                                                    onChange([
                                                        ...currentArrayValues,
                                                        option,
                                                    ]);
                                                } else {
                                                    onChange(
                                                        currentArrayValues.filter(
                                                            (v) => v !== option,
                                                        ),
                                                    );
                                                }
                                            }}
                                        />
                                        <Label
                                            htmlFor={`${fieldId}_${option}`}
                                            className="mb-0 font-normal text-gray-700 capitalize dark:text-gray-400"
                                        >
                                            {option.replace(/_/g, ' ')}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {error && <InputError message={error} />}
                        </div>
                    );
                }
                return (
                    <div>
                        <Label htmlFor={fieldId}>
                            {displayName}
                            {required && (
                                <span className="text-error-500"> *</span>
                            )}
                        </Label>
                        <TextArea
                            placeholder="Enter comma-separated values"
                            value={
                                Array.isArray(value)
                                    ? value.join(', ')
                                    : asStringValue(value)
                            }
                            onChange={(val) => {
                                const items = val
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter((item) => item.length > 0);
                                onChange(items);
                            }}
                            error={!!error}
                            rows={2}
                        />
                        {error && <InputError message={error} />}
                    </div>
                );

            case 'string':
            default:
                if (schema.enum) {
                    const selectOptions = schema.enum.map((opt) => {
                        const optStr = String(opt);
                        return {
                            value: optStr,
                            label:
                                optStr.charAt(0).toUpperCase() +
                                optStr.slice(1).replace(/_/g, ' '),
                        };
                    });
                    return (
                        <div>
                            <Label htmlFor={fieldId}>
                                {displayName}
                                {required && (
                                    <span className="text-error-500"> *</span>
                                )}
                            </Label>
                            <Select
                                options={selectOptions}
                                placeholder={`Select ${displayName.toLowerCase()}`}
                                onChange={(val) => onChange(val)}
                                defaultValue={asStringValue(value ?? schema.default ?? '')}
                            />
                            {error && <InputError message={error} />}
                        </div>
                    );
                }

                const isLongText = schema.maxLength && schema.maxLength > 100;

                if (isLongText) {
                    return (
                        <div>
                            <Label htmlFor={fieldId}>
                                {displayName}
                                {required && (
                                    <span className="text-error-500"> *</span>
                                )}
                            </Label>
                            <TextArea
                                placeholder={`Enter ${displayName.toLowerCase()}`}
                                value={asStringValue(value ?? schema.default ?? '')}
                                onChange={(val) => onChange(val)}
                                error={!!error}
                                rows={3}
                            />
                            {error && <InputError message={error} />}
                            {schema.maxLength && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Maximum {schema.maxLength} characters
                                </p>
                            )}
                        </div>
                    );
                }

                return (
                    <div>
                        <Label htmlFor={fieldId}>
                            {displayName}
                            {required && (
                                <span className="text-error-500"> *</span>
                            )}
                        </Label>
                        <Input
                            type="text"
                            id={fieldId}
                            name={fieldName}
                            value={asStringOrNumberValue(value ?? schema.default ?? '')}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={`Enter ${displayName.toLowerCase()}`}
                            error={!!error}
                            required={required}
                        />
                        {error && <InputError message={error} />}
                        {(schema.minLength || schema.maxLength) && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {schema.minLength &&
                                    schema.maxLength &&
                                    `${schema.minLength}-${schema.maxLength} characters`}
                                {schema.minLength &&
                                    !schema.maxLength &&
                                    `Minimum ${schema.minLength} characters`}
                                {!schema.minLength &&
                                    schema.maxLength &&
                                    `Maximum ${schema.maxLength} characters`}
                            </p>
                        )}
                    </div>
                );
        }
    };

    return <div className="space-y-1">{renderField()}</div>;
}
