import { useState } from 'react';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { formatFieldName } from '../../lib/format-field-name';
import { useBuilderStore } from '@/stores/builder-store';
import { callApi } from '../../lib/api';
import type { ConfigFieldSchema } from '../../types/builder';
import { Search, X, Package } from 'lucide-react';

interface SearchProduct {
    id: number;
    name: string;
    sku?: string;
}

interface ProductPickerFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function ProductPickerField({ name, schema, value, onChange }: ProductPickerFieldProps) {
    const selectedIds = Array.isArray(value) ? (value as number[]) : [];
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchProduct[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const config = useBuilderStore((s) => s.config);

    async function handleSearch() {
        if (!query.trim() || !config) return;
        setIsSearching(true);

        const result = await callApi<{ data: SearchProduct[] }>(
            { url: `/pos/${config.shop_id}/search/products?q=${encodeURIComponent(query)}`, method: 'get' },
        );

        if (result.ok && Array.isArray(result.data?.data)) {
            setResults(result.data.data);
        } else if (result.ok && Array.isArray(result.data)) {
            setResults(result.data as unknown as SearchProduct[]);
        }
        setIsSearching(false);
    }

    function handleAdd(id: number) {
        if (!selectedIds.includes(id)) {
            onChange([...selectedIds, id]);
        }
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
                            <Package className="h-3 w-3" />
                            #{id}
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
                    type="text"
                    value={query}
                    placeholder="Search products..."
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                />
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSearch}
                    loading={isSearching}
                >
                    <Search className="h-4 w-4" />
                </Button>
            </div>

            {results.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {results.map((product) => {
                        const isSelected = selectedIds.includes(product.id);
                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => handleAdd(product.id)}
                                disabled={isSelected}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                                    isSelected
                                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                                }`}
                            >
                                <Package className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate">{product.name}</span>
                                {product.sku && (
                                    <span className="ml-auto shrink-0 text-xs text-gray-400">
                                        {product.sku}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
