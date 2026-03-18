import { useState } from 'react';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';
import { Tag, X, Plus } from 'lucide-react';

interface CategoryPickerFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function CategoryPickerField({ name, schema, value, onChange }: CategoryPickerFieldProps) {
    const selectedIds = Array.isArray(value) ? (value as number[]) : [];
    const [inputValue, setInputValue] = useState('');

    function handleAdd() {
        const parsed = parseInt(inputValue);
        if (isNaN(parsed) || selectedIds.includes(parsed)) return;
        onChange([...selectedIds, parsed]);
        setInputValue('');
    }

    function handleRemove(id: number) {
        onChange(selectedIds.filter((i) => i !== id));
    }

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatFieldName(name)}
            </label>
            {schema.description && (
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}

            {selectedIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedIds.map((id) => (
                        <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        >
                            <Tag className="h-3 w-3" />
                            Category #{id}
                            <button
                                type="button"
                                onClick={() => handleRemove(id)}
                                className="ml-0.5 rounded-full hover:text-brand-900 dark:hover:text-white"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex gap-1.5">
                <Input
                    type="number"
                    value={inputValue}
                    placeholder="Category ID"
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                />
                <Button size="sm" variant="outline" onClick={handleAdd}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Enter category IDs to include. A searchable picker will be available in a future update.
            </p>
        </div>
    );
}
