import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface CollapsibleSectionProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    defaultOpen?: boolean;
    children: ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    badge?: ReactNode;
}

const CollapsibleSection: FC<CollapsibleSectionProps> = ({
    title,
    description,
    icon: Icon,
    defaultOpen = false,
    children,
    className,
    headerClassName,
    contentClassName,
    badge,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div
            className={clsx(
                'overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                className,
            )}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'flex w-full items-center justify-between p-4 text-left transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
                    headerClassName,
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                            <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                                {title}
                            </h3>
                            {badge}
                        </div>
                        {description && (
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="ml-4 shrink-0">
                    {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
            </button>

            <div
                className={clsx(
                    'grid transition-all duration-200 ease-in-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
            >
                <div className="overflow-hidden">
                    <div
                        className={clsx(
                            'border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6',
                            contentClassName,
                        )}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollapsibleSection;
