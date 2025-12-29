import type { FC } from 'react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ComboboxOption {
    value: string;
    label: string;
    description?: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    allowCustom?: boolean;
    disabled?: boolean;
    error?: boolean;
    className?: string;
    id?: string;
    name?: string;
}

const Combobox: FC<ComboboxProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select or type...',
    allowCustom = false,
    disabled = false,
    error = false,
    className,
    id,
    name,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) ||
                opt.value.toLowerCase().includes(query),
        );
    }, [options, searchQuery]);

    const displayValue = useMemo(() => {
        const selected = options.find((opt) => opt.value === value);
        return selected?.label || value;
    }, [options, value]);

    const handleSelect = useCallback(
        (selectedValue: string) => {
            onChange(selectedValue);
            setSearchQuery('');
            setIsOpen(false);
            inputRef.current?.blur();
        },
        [onChange],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchQuery(newValue);
        setIsOpen(true);
        setHighlightedIndex(0);

        if (allowCustom) {
            onChange(newValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex((prev) =>
                        Math.min(prev + 1, filteredOptions.length - 1),
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                } else if (allowCustom && searchQuery) {
                    handleSelect(searchQuery);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchQuery('');
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
        inputRef.current?.focus();
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

    useEffect(() => {
        if (isOpen && listRef.current) {
            const highlighted = listRef.current.children[highlightedIndex] as HTMLElement;
            highlighted?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, isOpen]);

    return (
        <div ref={containerRef} className={clsx('relative', className)}>
            <div
                className={clsx(
                    'relative flex h-11 items-center rounded-lg border shadow-theme-xs transition-colors',
                    disabled
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-40 dark:border-gray-700 dark:bg-gray-800'
                        : error
                          ? 'border-error-500 focus-within:border-error-300 focus-within:ring-3 focus-within:ring-error-500/20 dark:border-error-500'
                          : 'border-gray-300 bg-transparent focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/20 dark:border-gray-700 dark:focus-within:border-brand-800',
                )}
            >
                <input
                    ref={inputRef}
                    type="text"
                    id={id}
                    value={isOpen ? searchQuery : displayValue}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    className={clsx(
                        'h-full w-full rounded-lg bg-transparent px-4 py-2.5 text-sm',
                        'placeholder:text-gray-400 focus:outline-none',
                        'dark:text-white/90 dark:placeholder:text-white/30',
                        disabled && 'cursor-not-allowed',
                    )}
                />

                <div className="flex items-center gap-1 pr-2">
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
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

            {name && <input type="hidden" name={name} value={value} />}

            {isOpen && !disabled && (
                <ul
                    ref={listRef}
                    className={clsx(
                        'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg',
                        'border border-gray-200 bg-white shadow-lg',
                        'dark:border-gray-700 dark:bg-gray-800',
                    )}
                >
                    {filteredOptions.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {allowCustom && searchQuery
                                ? `Press Enter to use "${searchQuery}"`
                                : 'No options found'}
                        </li>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <li
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={clsx(
                                    'flex cursor-pointer items-center justify-between px-4 py-2.5',
                                    'text-sm transition-colors',
                                    highlightedIndex === index
                                        ? 'bg-brand-50 dark:bg-brand-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={clsx(
                                            'truncate font-medium',
                                            value === option.value
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
                                {value === option.value && (
                                    <Check className="ml-2 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                                )}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default Combobox;
