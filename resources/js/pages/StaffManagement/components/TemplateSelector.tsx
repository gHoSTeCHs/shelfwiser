import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Check, ChevronRight, FileText, Search, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { EmployeeTemplate } from '@/types/staff';
import { formatCurrency } from '@/types/staff';

interface TemplateSelectorProps {
    templates: EmployeeTemplate[];
    selectedTemplateId: number | null;
    onSelect: (template: EmployeeTemplate) => void;
    disabled?: boolean;
}

const TemplateSelector: FC<TemplateSelectorProps> = ({
    templates,
    selectedTemplateId,
    onSelect,
    disabled = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const filteredTemplates = useMemo(() => {
        if (!searchQuery) return templates;
        const query = searchQuery.toLowerCase();
        return templates.filter(
            (t) =>
                t.name.toLowerCase().includes(query) ||
                t.position_title.toLowerCase().includes(query) ||
                t.role_label.toLowerCase().includes(query) ||
                (t.department && t.department.toLowerCase().includes(query)),
        );
    }, [templates, searchQuery]);

    const systemTemplates = useMemo(
        () => filteredTemplates.filter((t) => t.is_system),
        [filteredTemplates],
    );

    const customTemplates = useMemo(
        () => filteredTemplates.filter((t) => !t.is_system),
        [filteredTemplates],
    );

    const selectedTemplate = useMemo(
        () => templates.find((t) => t.id === selectedTemplateId),
        [templates, selectedTemplateId],
    );

    if (templates.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={disabled}
                className={clsx(
                    'flex w-full items-center justify-between p-4 text-left transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            Quick Setup with Templates
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedTemplate
                                ? `Using: ${selectedTemplate.name}`
                                : 'Choose a template to pre-fill the form'}
                        </p>
                    </div>
                </div>
                <ChevronRight
                    className={clsx(
                        'h-5 w-5 text-gray-400 transition-transform',
                        isExpanded && 'rotate-90',
                    )}
                />
            </button>

            {isExpanded && (
                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                    <div className="relative mb-4">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                        />
                    </div>

                    <div className="max-h-80 space-y-4 overflow-y-auto">
                        {systemTemplates.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    System Templates
                                </h4>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {systemTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            isSelected={
                                                selectedTemplateId ===
                                                template.id
                                            }
                                            onSelect={() => onSelect(template)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {customTemplates.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    Your Templates
                                </h4>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {customTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            isSelected={
                                                selectedTemplateId ===
                                                template.id
                                            }
                                            onSelect={() => onSelect(template)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredTemplates.length === 0 && (
                            <div className="py-8 text-center">
                                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    No templates found matching your search.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface TemplateCardProps {
    template: EmployeeTemplate;
    isSelected: boolean;
    onSelect: () => void;
}

const TemplateCard: FC<TemplateCardProps> = ({
    template,
    isSelected,
    onSelect,
}) => {

    console.log(template)
    return (
        <button
            type="button"
            onClick={onSelect}
            className={clsx(
                'relative flex w-full flex-col rounded-lg border p-3 text-left transition-all',
                isSelected
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600',
            )}
        >
            {isSelected && (
                <div className="absolute top-2 right-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                        <Check className="h-3 w-3 text-white" />
                    </div>
                </div>
            )}

            <div className="flex items-start gap-2">
                <FileText
                    className={clsx(
                        'mt-0.5 h-4 w-4 shrink-0',
                        isSelected
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-gray-400',
                    )}
                />
                <div className="min-w-0 flex-1 pr-6">
                    <p
                        className={clsx(
                            'truncate text-sm font-medium',
                            isSelected
                                ? 'text-brand-900 dark:text-brand-100'
                                : 'text-gray-900 dark:text-white',
                        )}
                    >
                        {template.name}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {template.position_title} • {template.role_label}
                    </p>
                </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                    {template.employment_type_label}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                    {template.pay_type_label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(template.pay_amount)}/
                    {template.pay_frequency_label.toLowerCase()}
                </span>
            </div>

            {template.description && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {template.description}
                </p>
            )}
        </button>
    );
};

export default TemplateSelector;
