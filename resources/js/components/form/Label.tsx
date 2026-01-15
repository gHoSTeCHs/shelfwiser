import { clsx } from 'clsx';
import type { FC, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface LabelProps {
    htmlFor?: string;
    children: ReactNode;
    className?: string;
    required?: boolean;
    optional?: boolean;
}

const Label: FC<LabelProps> = ({
    htmlFor,
    children,
    className,
    required = false,
    optional = false,
}) => {
    return (
        <label
            htmlFor={htmlFor}
            className={clsx(
                twMerge(
                    'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400',
                    className,
                ),
            )}
        >
            {children}
            {required && <span className="ml-1 text-error-500">*</span>}
            {optional && (
                <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                    (optional)
                </span>
            )}
        </label>
    );
};

export default Label;
