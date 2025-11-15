import { router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import Select from '@/components/form/Select';
import DatePicker from '@/components/form/date-picker';
import Button from '@/components/ui/button/Button';
import { Filter, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FilterOption {
    label: string;
    value: string | number;
}

interface FilterConfig {
    name: string;
    label: string;
    type: 'select' | 'date' | 'search';
    options?: FilterOption[];
    placeholder?: string;
    value?: string | number | null;
}

interface FilterBarProps {
    filters: FilterConfig[];
    currentFilters: Record<string, any>;
    onFilterChange?: (filters: Record<string, any>) => void;
    onExport?: () => void;
    onReset?: () => void;
    exportUrl?: string;
    showExport?: boolean;
    showReset?: boolean;
}

export default function FilterBar({
    filters,
    currentFilters,
    onFilterChange,
    onExport,
    onReset,
    exportUrl,
    showExport = true,
    showReset = true,
}: FilterBarProps) {
    const [localFilters, setLocalFilters] = useState(currentFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilterChange = (name: string, value: any) => {
        const newFilters = { ...localFilters, [name]: value };
        setLocalFilters(newFilters);

        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const applyFilters = () => {
        router.get(
            window.location.pathname,
            Object.fromEntries(
                Object.entries(localFilters).filter(([_, value]) => value !== null && value !== ''),
            ),
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const resetFilters = () => {
        const resetFilters: Record<string, null> = {};
        filters.forEach((filter) => {
            resetFilters[filter.name] = null;
        });
        setLocalFilters(resetFilters);

        if (onReset) {
            onReset();
        } else {
            router.get(window.location.pathname, {}, {
                preserveState: false,
                preserveScroll: false,
            });
        }
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
        setShowExportMenu(false);

        if (onExport) {
            onExport();
        } else if (exportUrl) {
            const params = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(currentFilters).filter(([_, value]) => value !== null && value !== ''),
                ),
            );
            params.append('format', format);
            window.location.href = `${exportUrl}?${params.toString()}`;
        }
    };

    return (
        <Card className="mb-6 p-4">
            <div className="space-y-4">
                {/* Header Row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                        <Filter className="h-4 w-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    <div className="flex flex-wrap gap-2">
                        {showExport && (
                            <div className="relative" ref={exportMenuRef}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>

                                {showExportMenu && (
                                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                        <div className="py-1">
                                            <button
                                                onClick={() => handleExport('csv')}
                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Export as CSV
                                            </button>
                                            <button
                                                onClick={() => handleExport('excel')}
                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Export as Excel
                                            </button>
                                            <button
                                                onClick={() => handleExport('pdf')}
                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Export as PDF
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {showReset && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilters}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Fields */}
                {showFilters && (
                    <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filters.map((filter) => (
                                <div key={filter.name}>
                                    {filter.type === 'select' && (
                                        <Select
                                            label={filter.label}
                                            value={localFilters[filter.name] || ''}
                                            onChange={(value) =>
                                                handleFilterChange(filter.name, value)
                                            }
                                        >
                                            <option value="">
                                                {filter.placeholder || `All ${filter.label}`}
                                            </option>
                                            {filter.options?.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Select>
                                    )}

                                    {filter.type === 'date' && (
                                        <DatePicker
                                            label={filter.label}
                                            value={localFilters[filter.name] || ''}
                                            onChange={(value) =>
                                                handleFilterChange(filter.name, value)
                                            }
                                        />
                                    )}

                                    {filter.type === 'search' && (
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {filter.label}
                                            </label>
                                            <input
                                                type="text"
                                                value={localFilters[filter.name] || ''}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        filter.name,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={filter.placeholder}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Apply Button */}
                        <div className="flex justify-end">
                            <Button onClick={applyFilters} size="sm">
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
