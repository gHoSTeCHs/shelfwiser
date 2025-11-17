import { Link } from '@inertiajs/react';
import React from 'react';
import { ChevronRight } from 'lucide-react';

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
                                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                            )}

                            {isLast ? (
                                <span className="text-gray-900 font-medium">
                                    {item.label}
                                </span>
                            ) : item.href ? (
                                <Link
                                    href={item.href}
                                    className="text-gray-600 hover:text-primary-600 transition"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-gray-600">{item.label}</span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
