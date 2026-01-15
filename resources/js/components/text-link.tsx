import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';

interface TextLinkProps {
    href: string;
    className?: string;
    tabIndex?: number;
    children: ReactNode;
}

export default function TextLink({
    href,
    className = '',
    tabIndex,
    children,
}: TextLinkProps) {
    return (
        <Link
            href={href}
            className={`text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 ${className}`}
            tabIndex={tabIndex}
        >
            {children}
        </Link>
    );
}
