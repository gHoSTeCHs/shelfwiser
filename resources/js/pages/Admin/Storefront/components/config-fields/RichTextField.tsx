import TextArea from '@/components/form/input/TextArea';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';

interface RichTextFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function RichTextField({ name, schema, value, onChange }: RichTextFieldProps) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatFieldName(name)}
            </label>
            <TextArea
                value={(value as string) ?? ''}
                onChange={(val) => onChange(val)}
                rows={6}
                placeholder="Enter content..."
            />
            {schema.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}
        </div>
    );
}
