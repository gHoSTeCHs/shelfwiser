import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';

interface PresetColorPickerProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

const DEFAULT_PRESETS = [
    '#465fff', '#12b76a', '#f04438', '#f79009', '#7c3aed',
    '#0891b2', '#ea580c', '#be185d', '#15803d', '#1e40af',
];

export function PresetColorPicker({ name, schema, value, onChange }: PresetColorPickerProps) {
    const currentValue = (value as string) ?? '';
    const presets = (schema.options as string[] | undefined) ?? DEFAULT_PRESETS;

    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatFieldName(name)}
            </label>
            <div className="flex flex-wrap gap-2">
                {presets.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={`h-7 w-7 rounded-full border-2 transition-all ${
                            currentValue === color
                                ? 'border-gray-900 ring-2 ring-brand-500/30 dark:border-white'
                                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                    />
                ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input
                    type="color"
                    value={currentValue || '#465fff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-transparent dark:border-gray-700"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentValue || 'No color selected'}
                </span>
            </div>
            {schema.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}
        </div>
    );
}
