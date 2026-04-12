import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';

interface SliderFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function SliderField({ name, schema, value, onChange }: SliderFieldProps) {
    const numValue = Number(value ?? schema.default ?? 0);

    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatFieldName(name)}
                </label>
                <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
                    {numValue.toFixed(2)}
                </span>
            </div>
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={numValue}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-500 dark:bg-gray-700"
            />
            {schema.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}
        </div>
    );
}
