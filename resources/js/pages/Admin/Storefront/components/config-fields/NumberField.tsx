import Input from '@/components/form/input/InputField';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';

interface NumberFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function NumberField({ name, schema, value, onChange }: NumberFieldProps) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatFieldName(name)}
            </label>
            <Input
                type="number"
                value={value as number ?? 0}
                placeholder={schema.placeholder}
                onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    onChange(isNaN(parsed) ? 0 : parsed);
                }}
            />
            {schema.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}
        </div>
    );
}
