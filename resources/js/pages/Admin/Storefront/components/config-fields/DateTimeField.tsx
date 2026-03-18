import Input from '@/components/form/input/InputField';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';

interface DateTimeFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function DateTimeField({ name, schema, value, onChange }: DateTimeFieldProps) {
    const stringValue = (value as string) ?? '';
    const inputValue = stringValue ? stringValue.slice(0, 16) : '';

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatFieldName(name)}
            </label>
            <Input
                type="datetime-local"
                value={inputValue}
                onChange={(e) => onChange(e.target.value)}
            />
            {schema.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}
        </div>
    );
}
