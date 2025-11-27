import { useState, useRef, useEffect, useMemo } from 'react';
import Input from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';
import { LayoutTemplate, Search, X, Check, Package } from 'lucide-react';

interface ProductType {
    id: number;
    label: string;
    slug: string;
}

interface ProductCategory {
    id: number;
    name: string;
    slug: string;
}

interface ProductTemplate {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    product_type_id: number;
    category_id: number | null;
    template_structure: {
        variants: Array<{
            name: string;
            attributes: Record<string, string>;
            packaging_types: Array<{
                name: string;
                display_name: string;
                units_per_package: number;
                is_base_unit: boolean;
                can_break_down: boolean;
            }>;
        }>;
    };
    has_variants: boolean;
    is_active: boolean;
    product_type: ProductType | null;
    category: ProductCategory | null;
}

interface SearchableTemplateSelectorProps {
    templates: ProductTemplate[];
    onSelect: (templateId: string) => void;
    selectedTemplateId?: number | '';
}

export default function SearchableTemplateSelector({
    templates,
    onSelect,
    selectedTemplateId,
}: SearchableTemplateSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter templates based on search query
    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;

        const query = searchQuery.toLowerCase();
        return templates.filter(
            (template) =>
                template.name.toLowerCase().includes(query) ||
                template.product_type?.label.toLowerCase().includes(query) ||
                template.category?.name.toLowerCase().includes(query) ||
                template.description?.toLowerCase().includes(query)
        );
    }, [templates, searchQuery]);

    // Get selected template for display
    const selectedTemplate = selectedTemplateId
        ? templates.find((t) => t.id === selectedTemplateId)
        : null;

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index when filtered results change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredTemplates]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!isOpen) {
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
                setIsOpen(true);
                event.preventDefault();
            }
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredTemplates.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                event.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                event.preventDefault();
                if (filteredTemplates[highlightedIndex]) {
                    handleSelect(filteredTemplates[highlightedIndex].id);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (templateId: number) => {
        onSelect(templateId.toString());
        setIsOpen(false);
        setSearchQuery('');
    };

    const clearSelection = (event: React.MouseEvent) => {
        event.stopPropagation();
        onSelect('');
        setSearchQuery('');
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger button / selected display */}
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 cursor-pointer hover:border-gray-400 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <LayoutTemplate className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {selectedTemplate ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="truncate text-gray-900 dark:text-white">
                                {selectedTemplate.name}
                            </span>
                            {selectedTemplate.product_type && (
                                <Badge color="light" size="sm">
                                    {selectedTemplate.product_type.label}
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                            Search for a template...
                        </span>
                    )}
                </div>
                {selectedTemplate ? (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-700"
                    >
                        <X className="h-4 w-4 text-gray-400" />
                    </button>
                ) : (
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type to search templates..."
                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Results list */}
                    <div
                        ref={listRef}
                        className="max-h-64 overflow-y-auto"
                        role="listbox"
                    >
                        {filteredTemplates.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery ? (
                                    <>
                                        No templates found for "{searchQuery}"
                                    </>
                                ) : (
                                    'No templates available'
                                )}
                            </div>
                        ) : (
                            filteredTemplates.map((template, index) => (
                                <div
                                    key={template.id}
                                    onClick={() => handleSelect(template.id)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    role="option"
                                    aria-selected={selectedTemplateId === template.id}
                                    className={`cursor-pointer px-3 py-2.5 ${
                                        index === highlightedIndex
                                            ? 'bg-primary-50 dark:bg-primary-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    } ${
                                        selectedTemplateId === template.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white truncate">
                                                    {template.name}
                                                </span>
                                                {selectedTemplateId === template.id && (
                                                    <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                                {template.product_type && (
                                                    <Badge color="light" size="sm">
                                                        {template.product_type.label}
                                                    </Badge>
                                                )}
                                                {template.category && (
                                                    <Badge color="info" size="sm">
                                                        {template.category.name}
                                                    </Badge>
                                                )}
                                                {template.has_variants && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <Package className="h-3 w-3" />
                                                        {template.template_structure.variants.length} variants
                                                    </span>
                                                )}
                                            </div>
                                            {template.description && (
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                    {template.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer with count */}
                    {filteredTemplates.length > 0 && (
                        <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            {filteredTemplates.length === templates.length
                                ? `${templates.length} templates available`
                                : `${filteredTemplates.length} of ${templates.length} templates`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
