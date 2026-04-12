import Select from '@/components/form/Select';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';

interface SelectFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function SelectField({ name, schema, value, onChange }: SelectFieldProps) {
    const options = (schema.options ?? []).map((opt) => ({
        value: String(opt),
        label: typeof opt === 'string' ? formatFieldName(opt) : String(opt),
    }));

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatFieldName(name)}
            </label>
            <Select
                options={options}
                value={String(value ?? '')}
                onChange={(val) => {
                    const original = schema.options?.find((o) => String(o) === val);
                    onChange(original ?? val);
                }}
                placeholder={`Select ${formatFieldName(name).toLowerCase()}`}
            />
            {schema.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}
        </div>
    );
}
