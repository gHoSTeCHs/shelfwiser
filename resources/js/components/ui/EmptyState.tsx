import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
}

const EmptyState = ({ icon, title, description, action, className = '' }: EmptyStateProps) => {
    return (
        <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8 text-center ${className}`}>
            <div className="mx-auto mb-4 text-gray-400">
                {icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {description}
            </p>
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
