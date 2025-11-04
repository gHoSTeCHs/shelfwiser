import { ReactNode } from 'react';

interface IconCardProps {
  title: string;
  description?: string;
  icon: ReactNode;
  children?: ReactNode;
  className?: string;
}

const IconCard = ({ title, description, icon, children, className = '' }: IconCardProps) => {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      <div className="p-6">
        <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400">
          {icon}
        </div>
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

export default IconCard;