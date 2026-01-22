import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import React from 'react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

/**
 * Navigation breadcrumb trail component.
 * Shows clickable path from home to current page.
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center space-x-2 text-sm">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center">
                            {index > 0 && (
                                <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                            )}

                            {isLast ? (
                                <span className="font-medium text-gray-900">
                                    {item.label}
                                </span>
                            ) : item.href ? (
                                <Link
                                    href={item.href}
                                    className="text-gray-600 transition hover:text-brand-600"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-gray-600">
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
