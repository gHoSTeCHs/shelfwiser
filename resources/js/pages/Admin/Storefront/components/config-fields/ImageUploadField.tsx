import Input from '@/components/form/input/InputField';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';
import { ImageIcon, X } from 'lucide-react';

interface ImageUploadFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function ImageUploadField({ name, schema, value, onChange }: ImageUploadFieldProps) {
    const imageUrl = (value as string) ?? '';

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatFieldName(name)}
            </label>

            {imageUrl && (
                <div className="relative mb-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-32 w-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="absolute right-2 top-2 rounded-full bg-gray-900/60 p-1 text-white hover:bg-gray-900/80"
                        aria-label="Remove image"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {!imageUrl && (
                <div className="mb-2 flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                    <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs">Paste image URL below</span>
                    </div>
                </div>
            )}

            <Input
                type="text"
                value={imageUrl}
                placeholder="https://example.com/image.jpg"
                onChange={(e) => onChange(e.target.value || null)}
            />
            {schema.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}
        </div>
    );
}
