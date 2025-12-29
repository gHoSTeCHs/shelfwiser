import type { FC } from 'react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface MultiSelectOption {
    value: string | number;
    label: string;
    description?: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    value: (string | number)[];
    onChange: (value: (string | number)[]) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    className?: string;
    id?: string;
    name?: string;
    maxDisplay?: number;
}

const MultiSelect: FC<MultiSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select options...',
    disabled = false,
    error = false,
    className,
    id,
    name,
    maxDisplay = 3,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) ||
                String(opt.value).toLowerCase().includes(query),
        );
    }, [options, searchQuery]);

    const selectedOptions = useMemo(() => {
        return options.filter((opt) => value.includes(opt.value));
    }, [options, value]);

    const handleToggle = useCallback(
        (optionValue: string | number) => {
            if (value.includes(optionValue)) {
                onChange(value.filter((v) => v !== optionValue));
            } else {
                onChange([...value, optionValue]);
            }
        },
        [value, onChange],
    );

    const handleRemove = useCallback(
        (optionValue: string | number, e: React.MouseEvent) => {
            e.stopPropagation();
            onChange(value.filter((v) => v !== optionValue));
        },
        [value, onChange],
    );

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayedOptions = selectedOptions.slice(0, maxDisplay);
    const remainingCount = selectedOptions.length - maxDisplay;

    return (
        <div ref={containerRef} className={clsx('relative', className)} id={id}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={clsx(
                    'relative flex min-h-[2.75rem] cursor-pointer items-center rounded-lg border shadow-theme-xs transition-colors',
                    disabled
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-40 dark:border-gray-700 dark:bg-gray-800'
                        : error
                          ? 'border-error-500 focus-within:border-error-300 focus-within:ring-3 focus-within:ring-error-500/20 dark:border-error-500'
                          : 'border-gray-300 bg-transparent focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/20 dark:border-gray-700 dark:focus-within:border-brand-800',
                )}
            >
                <div className="flex flex-1 flex-wrap items-center gap-1.5 px-3 py-2">
                    {selectedOptions.length === 0 ? (
                        <span className="text-sm text-gray-400 dark:text-white/30">
                            {placeholder}
                        </span>
                    ) : (
                        <>
                            {displayedOptions.map((opt) => (
                                <span
                                    key={opt.value}
                                    className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                                >
                                    {opt.label}
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleRemove(opt.value, e)}
                                            className="rounded hover:bg-brand-100 dark:hover:bg-brand-800/50"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </span>
                            ))}
                            {remainingCount > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{remainingCount} more
                                </span>
                            )}
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 pr-2">
                    {value.length > 0 && !disabled && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <ChevronDown
                        className={clsx(
                            'h-4 w-4 text-gray-400 transition-transform',
                            isOpen && 'rotate-180',
                        )}
                    />
                </div>
            </div>

            {name &&
                value.map((v, i) => (
                    <input key={i} type="hidden" name={`${name}[]`} value={v} />
                ))}

            {isOpen && !disabled && (
                <div
                    className={clsx(
                        'absolute z-50 mt-1 w-full overflow-hidden rounded-lg',
                        'border border-gray-200 bg-white shadow-lg',
                        'dark:border-gray-700 dark:bg-gray-800',
                    )}
                >
                    <div className="border-b border-gray-200 p-2 dark:border-gray-700">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                            autoFocus
                        />
                    </div>

                    <ul className="max-h-60 overflow-auto">
                        {filteredOptions.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                No options found
                            </li>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = value.includes(option.value);
                                return (
                                    <li
                                        key={option.value}
                                        onClick={() => handleToggle(option.value)}
                                        className={clsx(
                                            'flex cursor-pointer items-center justify-between px-4 py-2.5',
                                            'text-sm transition-colors',
                                            isSelected
                                                ? 'bg-brand-50 dark:bg-brand-900/20'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                                        )}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={clsx(
                                                    'truncate font-medium',
                                                    isSelected
                                                        ? 'text-brand-600 dark:text-brand-400'
                                                        : 'text-gray-900 dark:text-white',
                                                )}
                                            >
                                                {option.label}
                                            </p>
                                            {option.description && (
                                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                                    {option.description}
                                                </p>
                                            )}
                                        </div>
                                        <div
                                            className={clsx(
                                                'ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                                                isSelected
                                                    ? 'border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500'
                                                    : 'border-gray-300 dark:border-gray-600',
                                            )}
                                        >
                                            {isSelected && (
                                                <Check className="h-3.5 w-3.5 text-white" />
                                            )}
                                        </div>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
