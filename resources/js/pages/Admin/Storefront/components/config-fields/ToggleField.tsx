import Toggle from '@/components/ui/toggle/Toggle';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';

interface ToggleFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function ToggleField({ name, schema, value, onChange }: ToggleFieldProps) {
    return (
        <div className="flex items-center justify-between gap-3 py-1">
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatFieldName(name)}
                </p>
                {schema.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {schema.description}
                    </p>
                )}
            </div>
            <Toggle
                checked={Boolean(value)}
                onChange={(checked) => onChange(checked)}
                size="sm"
            />
        </div>
    );
}
