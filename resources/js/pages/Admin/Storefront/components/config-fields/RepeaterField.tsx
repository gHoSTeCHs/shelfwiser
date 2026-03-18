import { useRef, type ReactNode } from 'react';
import Button from '@/components/ui/button/Button';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

let keyCounter = 0;
function nextKey() {
    return `rep_${++keyCounter}`;
}

interface RepeaterFieldProps<T> {
    name: string;
    schema: ConfigFieldSchema;
    items: T[];
    onChange: (items: T[]) => void;
    renderItem: (item: T, index: number, onItemChange: (updated: T) => void) => ReactNode;
    createEmpty: () => T;
    maxItems?: number;
    itemLabel?: string;
}

export function RepeaterField<T>({
    name,
    schema,
    items,
    onChange,
    renderItem,
    createEmpty,
    maxItems = 20,
    itemLabel = 'item',
}: RepeaterFieldProps<T>) {
    const keysRef = useRef<string[]>([]);
    while (keysRef.current.length < items.length) {
        keysRef.current.push(nextKey());
    }
    if (keysRef.current.length > items.length) {
        keysRef.current = keysRef.current.slice(0, items.length);
    }

    function handleAdd() {
        if (items.length >= maxItems) return;
        keysRef.current.push(nextKey());
        onChange([...items, createEmpty()]);
    }

    function handleRemove(index: number) {
        keysRef.current.splice(index, 1);
        onChange(items.filter((_, i) => i !== index));
    }

    function handleMove(index: number, direction: 'up' | 'down') {
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= items.length) return;
        const updated = [...items];
        [updated[index], updated[target]] = [updated[target], updated[index]];
        const keys = keysRef.current;
        [keys[index], keys[target]] = [keys[target], keys[index]];
        onChange(updated);
    }

    function handleItemChange(index: number, updated: T) {
        const next = [...items];
        next[index] = updated;
        onChange(next);
    }

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatFieldName(name)}
                </label>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {items.length}{maxItems < 20 ? `/${maxItems}` : ''}
                </span>
            </div>
            {schema.description && (
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    {schema.description}
                </p>
            )}

            <div className="space-y-2">
                {items.map((item, index) => (
                    <div
                        key={keysRef.current[index]}
                        className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {formatFieldName(itemLabel)} {index + 1}
                            </span>
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => handleMove(index, 'up')}
                                    disabled={index === 0}
                                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                                    aria-label="Move up"
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMove(index, 'down')}
                                    disabled={index === items.length - 1}
                                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                                    aria-label="Move down"
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="rounded p-0.5 text-gray-400 hover:text-error-600 dark:hover:text-error-400"
                                    aria-label={`Remove ${itemLabel}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3 p-3">
                            {renderItem(item, index, (updated) => handleItemChange(index, updated))}
                        </div>
                    </div>
                ))}
            </div>

            <Button
                size="sm"
                variant="outline"
                startIcon={<Plus className="h-4 w-4" />}
                onClick={handleAdd}
                disabled={items.length >= maxItems}
                className="mt-2 w-full"
            >
                Add {formatFieldName(itemLabel)}
            </Button>
        </div>
    );
}
